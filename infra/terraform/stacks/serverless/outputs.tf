output "api_endpoint" {
  description = "Default execute-api URL. Smoke-test service paths under /api/<service>/... here before DNS cutover."
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "api_custom_domain" {
  description = "Custom domain once enable_custom_domain = true."
  value       = var.enable_custom_domain ? var.api_domain_name : null
}

output "function_names" {
  value = { for k, fn in aws_lambda_function.svc : k => fn.function_name }
}

output "artifacts_bucket" {
  value = aws_s3_bucket.artifacts.bucket
}
