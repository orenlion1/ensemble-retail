resource "aws_apigatewayv2_api" "http" {
  name          = "ensemble-grafana-api"
  protocol_type = "HTTP"
  description   = "Fronts the Ensemble service Lambdas. CORS/auth are handled inside each Spring app."
  tags          = local.tags
}

# AWS_PROXY integration per service, targeting the SnapStart alias. Payload format 1.0 so
# aws-serverless-java-container's default (AwsProxyRequest) proxy handles the event.
resource "aws_apigatewayv2_integration" "svc" {
  for_each               = local.services
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_alias.live[each.key].invoke_arn
  payload_format_version = "1.0"
  timeout_milliseconds   = var.lambda_timeout_seconds * 1000
}

# /api/<service>/{proxy+} — the storefront calls these prefixes; the full path is forwarded
# to Spring, which matches its /api/<service>/... @RequestMapping routes unchanged.
resource "aws_apigatewayv2_route" "svc" {
  for_each  = local.services
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "ANY /api/${each.value.route_prefix}/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.svc[each.key].id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true

  # Stage-wide throttle — replaces the retired WAF per-IP rate limit and bounds cost.
  default_route_settings {
    throttling_rate_limit  = var.api_throttle_rate
    throttling_burst_limit = var.api_throttle_burst
  }

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api.arn
    format = jsonencode({
      requestId       = "$context.requestId"
      httpMethod      = "$context.httpMethod"
      path            = "$context.path"
      status          = "$context.status"
      integrationErr  = "$context.integrationErrorMessage"
      responseLatency = "$context.responseLatency"
    })
  }

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/apigateway/ensemble-grafana-api"
  retention_in_days = 14
  tags              = local.tags
}

resource "aws_lambda_permission" "apigw" {
  for_each      = local.services
  statement_id  = "AllowApiGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.svc[each.key].function_name
  qualifier     = aws_lambda_alias.live[each.key].name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

# --- Custom domain (cutover; gated by enable_custom_domain) ---
resource "aws_apigatewayv2_domain_name" "api" {
  count       = var.enable_custom_domain ? 1 : 0
  domain_name = var.api_domain_name

  domain_name_configuration {
    certificate_arn = var.acm_certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  tags = local.tags
}

resource "aws_apigatewayv2_api_mapping" "api" {
  count       = var.enable_custom_domain ? 1 : 0
  api_id      = aws_apigatewayv2_api.http.id
  domain_name = aws_apigatewayv2_domain_name.api[0].id
  stage       = aws_apigatewayv2_stage.default.id
}

# A + AAAA so the UPSERT takes over both records the ALB alias previously owned; otherwise
# IPv6 clients keep resolving to the ALB after it is destroyed.
resource "aws_route53_record" "api" {
  for_each        = var.enable_custom_domain ? toset(["A", "AAAA"]) : toset([])
  zone_id         = var.route53_zone_id
  name            = var.api_domain_name
  type            = each.value
  allow_overwrite = true # take over the alias records the ALB ingress previously owned

  alias {
    name                   = aws_apigatewayv2_domain_name.api[0].domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.api[0].domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

# --- Secondary domain: api.ensemble-retail.com (gated by enable_retail_domain) ---
resource "aws_apigatewayv2_domain_name" "retail" {
  count       = var.enable_retail_domain ? 1 : 0
  domain_name = var.retail_domain_name

  domain_name_configuration {
    certificate_arn = var.acm_certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  tags = local.tags
}

resource "aws_apigatewayv2_api_mapping" "retail" {
  count       = var.enable_retail_domain ? 1 : 0
  api_id      = aws_apigatewayv2_api.http.id
  domain_name = aws_apigatewayv2_domain_name.retail[0].id
  stage       = aws_apigatewayv2_stage.default.id
}

resource "aws_route53_record" "retail" {
  for_each        = var.enable_retail_domain ? toset(["A", "AAAA"]) : toset([])
  zone_id         = var.retail_route53_zone_id
  name            = var.retail_domain_name
  type            = each.value
  allow_overwrite = true # replaces the stale CNAME that pointed at the destroyed ALB

  alias {
    name                   = aws_apigatewayv2_domain_name.retail[0].domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.retail[0].domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}
