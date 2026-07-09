data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  repo_root = var.repo_root

  # One entry per Java service Lambda. table_actions stays least-privilege: inventory is
  # read-only over the catalog; cart/account read+write only their own shopper table.
  services = {
    inventory = {
      handler       = "com.ensemblegrafana.inventory.StreamLambdaHandler::handleRequest"
      jar           = "${local.repo_root}/services/inventory-service/target/inventory-service.jar"
      table         = "ensemble-products"
      table_env     = "PRODUCTS_TABLE"
      table_actions = ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan"]
      route_prefix  = "inventory"
    }
    cart = {
      handler       = "com.ensemblegrafana.cart.StreamLambdaHandler::handleRequest"
      jar           = "${local.repo_root}/services/cart-service/target/cart-service.jar"
      table         = "ensemble-carts"
      table_env     = "DYNAMODB_CART_TABLE"
      table_actions = ["dynamodb:GetItem", "dynamodb:PutItem"]
      route_prefix  = "cart"
    }
    account = {
      handler       = "com.ensemblegrafana.account.StreamLambdaHandler::handleRequest"
      jar           = "${local.repo_root}/services/account-service/target/account-service.jar"
      table         = "ensemble-accounts"
      table_env     = "DYNAMODB_ACCOUNT_TABLE"
      table_actions = ["dynamodb:GetItem", "dynamodb:PutItem"]
      route_prefix  = "account"
    }
  }

  tags = {
    Application = "ensemble-grafana"
    Stack       = "serverless"
  }
}

# --- Artifact bucket (jars are ~47 MB; upload via S3 rather than inline) ---
resource "aws_s3_bucket" "artifacts" {
  bucket = "ensemble-grafana-lambda-artifacts-${data.aws_caller_identity.current.account_id}"
  tags   = local.tags
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket                  = aws_s3_bucket.artifacts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_object" "jar" {
  for_each = local.services
  bucket   = aws_s3_bucket.artifacts.id
  key      = "${each.key}/${basename(each.value.jar)}"
  source   = each.value.jar
  # source_hash (not etag): the jars upload as multipart, so S3's etag is not a plain md5 and
  # would show perpetual drift. source_hash triggers re-upload on real content change only.
  source_hash = filemd5(each.value.jar)
}

# --- Per-service execution roles (least privilege) ---
data "aws_iam_policy_document" "assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "svc" {
  for_each           = local.services
  name               = "ensemble-grafana-${each.key}-lambda"
  assume_role_policy = data.aws_iam_policy_document.assume.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "basic" {
  for_each   = local.services
  role       = aws_iam_role.svc[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "table" {
  for_each = local.services
  statement {
    sid       = "OwnTableOnly"
    actions   = each.value.table_actions
    resources = ["arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/${each.value.table}"]
  }
}

resource "aws_iam_role_policy" "table" {
  for_each = local.services
  name     = "dynamodb-${each.value.table}"
  role     = aws_iam_role.svc[each.key].id
  policy   = data.aws_iam_policy_document.table[each.key].json
}

# --- Functions (Java 21, arm64, SnapStart) ---
resource "aws_lambda_function" "svc" {
  for_each         = local.services
  function_name    = "ensemble-grafana-${each.key}"
  role             = aws_iam_role.svc[each.key].arn
  runtime          = "java21"
  architectures    = ["arm64"]
  handler          = each.value.handler
  memory_size      = var.lambda_memory_mb
  timeout          = var.lambda_timeout_seconds
  s3_bucket        = aws_s3_bucket.artifacts.id
  s3_key           = aws_s3_object.jar[each.key].key
  source_code_hash = filebase64sha256(each.value.jar)
  publish          = true

  reserved_concurrent_executions = var.reserved_concurrency

  snap_start {
    apply_on = "PublishedVersions"
  }

  environment {
    variables = {
      (each.value.table_env)      = each.value.table
      COGNITO_ISSUER_URI          = var.cognito_issuer_uri
      API_TEST_KEY                = var.api_key
      JWT_AUTH_ENABLED            = var.jwt_auth_enabled
      ALLOWED_CORS_ORIGINS        = var.allowed_cors_origins
      # A blank OTLP endpoint would override the yml default and fail the tracer bean, so
      # keep a valid default and disable tracing export entirely until a real Grafana Cloud
      # OTLP endpoint is supplied.
      OTEL_EXPORTER_OTLP_ENDPOINT = var.otlp_endpoint != "" ? var.otlp_endpoint : "http://localhost:4318/v1/traces"
      OTEL_EXPORTER_OTLP_HEADERS  = var.otlp_headers
      MANAGEMENT_TRACING_ENABLED  = var.otlp_endpoint != "" ? "true" : "false"
    }
  }

  tags = local.tags
}

# Alias pinned to the published (SnapStart-enabled) version; the API integrates the alias.
resource "aws_lambda_alias" "live" {
  for_each         = local.services
  name             = "live"
  function_name    = aws_lambda_function.svc[each.key].function_name
  function_version = aws_lambda_function.svc[each.key].version
}
