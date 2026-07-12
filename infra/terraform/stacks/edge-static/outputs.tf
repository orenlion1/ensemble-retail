output "route53_zone_id" {
  value = aws_route53_zone.primary.zone_id
}

output "route53_name_servers" {
  value = aws_route53_zone.primary.name_servers
}

output "tertiary_route53_zone_id" {
  value = aws_route53_zone.tertiary.zone_id
}

output "tertiary_route53_name_servers" {
  value = aws_route53_zone.tertiary.name_servers
}

output "edge_certificate_arn" {
  value = aws_acm_certificate.edge.arn
}

output "edge_certificate_validation_status" {
  value = aws_acm_certificate.edge.status
}

output "frontend_bucket_name" {
  value = aws_s3_bucket.frontend.bucket
}

output "images_bucket_name" {
  value = aws_s3_bucket.images.bucket
}

output "logs_bucket_name" {
  value = aws_s3_bucket.logs.bucket
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.frontend.domain_name
}

output "site_url" {
  value = "https://${var.domain_name}"
}

output "api_regional_waf_acl_arn" {
  value = aws_wafv2_web_acl.api_regional.arn
}
