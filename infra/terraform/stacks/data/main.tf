resource "aws_dynamodb_table" "carts" {
  name                        = "ensemble-carts"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "shopperId"
  deletion_protection_enabled = true
  point_in_time_recovery {
    enabled = true
  }
  server_side_encryption {
    enabled = true
  }
  attribute {
    name = "shopperId"
    type = "S"
  }

  tags = {
    Application = "ensemble-grafana"
    Stack       = "data"
    Service     = "cart"
  }
}

resource "aws_dynamodb_table" "accounts" {
  name                        = "ensemble-accounts"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "shopperId"
  deletion_protection_enabled = true
  point_in_time_recovery {
    enabled = true
  }
  server_side_encryption {
    enabled = true
  }
  attribute {
    name = "shopperId"
    type = "S"
  }

  tags = {
    Application = "ensemble-grafana"
    Stack       = "data"
    Service     = "account"
  }
}

resource "aws_dynamodb_table" "products" {
  name                        = "ensemble-products"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "id"
  deletion_protection_enabled = true
  point_in_time_recovery {
    enabled = true
  }
  server_side_encryption {
    enabled = true
  }
  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Application = "ensemble-grafana"
    Stack       = "data"
    Service     = "inventory"
  }
}

# Inventory moved off Aurora PostgreSQL to the ensemble-products DynamoDB table during the
# serverless cost-reduction migration (see docs/serverless-migration.md). The Aurora cluster,
# instance, DB subnet group, and DB security group were destroyed and their resource blocks
# removed so this stack no longer recreates them.

resource "aws_secretsmanager_secret" "app_runtime" {
  name                    = "ensemble-grafana/runtime"
  recovery_window_in_days = 30

  tags = {
    Application = "ensemble-grafana"
    Stack       = "data"
  }
}
