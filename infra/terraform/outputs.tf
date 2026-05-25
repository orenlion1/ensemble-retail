output "route53_zone_id" {
  value = aws_route53_zone.primary.zone_id
}

output "route53_name_servers" {
  value = aws_route53_zone.primary.name_servers
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.frontend.domain_name
}

output "site_url" {
  value = "https://${var.domain_name}"
}

output "vpc_id" {
  value = local.vpc_id
}

output "public_subnet_ids" {
  value = local.public_subnet_ids
}

output "private_subnet_ids" {
  value = local.private_subnet_ids
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.shopper.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.web.id
}

output "cognito_hosted_ui_domain" {
  value = "https://${aws_cognito_user_pool_domain.hosted_ui.domain}.auth.${var.aws_region}.amazoncognito.com"
}

output "google_oauth_redirect_uri" {
  value = "https://${aws_cognito_user_pool_domain.hosted_ui.domain}.auth.${var.aws_region}.amazoncognito.com/oauth2/idpresponse"
}

output "api_regional_waf_acl_arn" {
  value = aws_wafv2_web_acl.api_regional.arn
}

output "inventory_service_role_arn" {
  value = aws_iam_role.inventory_service.arn
}

output "cart_service_role_arn" {
  value = aws_iam_role.cart_service.arn
}

output "account_service_role_arn" {
  value = aws_iam_role.account_service.arn
}
