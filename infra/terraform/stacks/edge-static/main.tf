data "aws_caller_identity" "current" {}
data "aws_canonical_user_id" "current" {}

resource "aws_route53_zone" "primary" {
  name = var.domain_name
}

resource "aws_route53_zone" "secondary" {
  name = var.secondary_domain_name
}

resource "aws_acm_certificate" "edge" {
  provider          = aws.use1
  domain_name       = var.domain_name
  validation_method = "DNS"
  subject_alternative_names = compact([
    "www.${var.domain_name}",
    "api.${var.domain_name}",
    var.secondary_domain_name,
    var.secondary_domain_name != "" ? "www.${var.secondary_domain_name}" : "",
    var.secondary_domain_name != "" ? "api.${var.secondary_domain_name}" : "",
  ])

  # Adding SANs forces cert replacement; create the new cert (and switch CloudFront to it)
  # before destroying the old one so the live distribution never loses its viewer cert.
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "edge_certificate_validation" {
  for_each = {
    for option in aws_acm_certificate.edge.domain_validation_options : option.domain_name => {
      name   = option.resource_record_name
      record = option.resource_record_value
      type   = option.resource_record_type
      # Route each validation record into the zone that owns its domain.
      zone_id = (var.secondary_domain_name != "" && endswith(trimsuffix(option.domain_name, "."), var.secondary_domain_name)) ? aws_route53_zone.secondary.zone_id : aws_route53_zone.primary.zone_id
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 300
  type            = each.value.type
  zone_id         = each.value.zone_id
}

resource "aws_acm_certificate_validation" "edge" {
  provider                = aws.use1
  certificate_arn         = aws_acm_certificate.edge.arn
  validation_record_fqdns = [for record in aws_route53_record.edge_certificate_validation : record.fqdn]
}

resource "aws_s3_bucket" "frontend" {
  bucket = "ensemble-grafana-frontend-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket" "images" {
  bucket = "ensemble-grafana-images-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "images" {
  bucket                  = aws_s3_bucket.images.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "images" {
  bucket = aws_s3_bucket.images.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket" "logs" {
  bucket = "ensemble-grafana-logs-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket                  = aws_s3_bucket.logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "logs" {
  bucket = aws_s3_bucket.logs.id

  access_control_policy {
    grant {
      grantee {
        id   = data.aws_canonical_user_id.current.id
        type = "CanonicalUser"
      }
      permission = "FULL_CONTROL"
    }

    grant {
      grantee {
        id   = "c4c1ede66af53448b93c283ce9448c4ba468c9432aa01d700d3878632f77d2d0"
        type = "CanonicalUser"
      }
      permission = "FULL_CONTROL"
    }

    owner {
      id = data.aws_canonical_user_id.current.id
    }
  }

  depends_on = [
    aws_s3_bucket_ownership_controls.logs,
    aws_s3_bucket_public_access_block.logs
  ]
}

data "aws_iam_policy_document" "logs_delivery" {
  statement {
    sid = "AllowAlbAccessLogDeliveryAclCheck"
    actions = [
      "s3:GetBucketAcl"
    ]
    resources = [aws_s3_bucket.logs.arn]

    principals {
      type        = "Service"
      identifiers = ["logdelivery.elasticloadbalancing.amazonaws.com"]
    }
  }

  statement {
    sid = "AllowAlbAccessLogDeliveryWrite"
    actions = [
      "s3:PutObject"
    ]
    resources = [
      "${aws_s3_bucket.logs.arn}/alb/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
    ]

    principals {
      type        = "Service"
      identifiers = ["logdelivery.elasticloadbalancing.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id
  policy = data.aws_iam_policy_document.logs_delivery.json
}

resource "aws_wafv2_web_acl" "edge" {
  provider    = aws.use1
  name        = "ensemble-grafana-edge"
  scope       = "CLOUDFRONT"
  description = "WAF for Ensemble-Retail CloudFront distribution"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1
    override_action {
      none {}
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "common-rules"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2
    override_action {
      none {}
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "known-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 3
    override_action {
      none {}
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "sqli-rules"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimitPerIp"
    priority = 4
    action {
      block {}
    }
    statement {
      rate_based_statement {
        limit              = var.edge_rate_limit_per_ip
        aggregate_key_type = "IP"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "rate-limit-per-ip"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "ensemble-grafana-waf"
    sampled_requests_enabled   = true
  }
}

resource "aws_wafv2_web_acl" "api_regional" {
  name        = "ensemble-grafana-api"
  scope       = "REGIONAL"
  description = "Regional WAF for Ensemble-Retail API ALB"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1
    override_action {
      none {}
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "api-common-rules"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "ApiRateLimitPerIp"
    priority = 2
    action {
      block {}
    }
    statement {
      rate_based_statement {
        limit              = var.api_rate_limit_per_ip
        aggregate_key_type = "IP"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "api-rate-limit-per-ip"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "ensemble-grafana-api-waf"
    sampled_requests_enabled   = true
  }
}

resource "aws_cloudfront_response_headers_policy" "security" {
  name = "ensemble-grafana-security-headers"

  security_headers_config {
    content_type_options {
      override = true
    }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
    content_security_policy {
      content_security_policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' https://${var.api_origin_domain_name} https://api.${var.secondary_domain_name} https://${var.cognito_domain_prefix}.auth.${var.aws_region}.amazoncognito.com https://faro-collector-prod-us-east-3.grafana.net; font-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"
      override                = true
    }
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }
    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }
  }

  custom_headers_config {
    items {
      header   = "Permissions-Policy"
      override = true
      value    = "camera=(), microphone=(), geolocation=(), payment=()"
    }
  }
}

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "ensemble-grafana-frontend"
  description                       = "OAC for frontend static assets"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases = compact([
    var.domain_name,
    "www.${var.domain_name}",
    var.secondary_domain_name,
    var.secondary_domain_name != "" ? "www.${var.secondary_domain_name}" : "",
  ])
  web_acl_id = aws_wafv2_web_acl.edge.arn
  depends_on = [aws_acm_certificate_validation.edge]

  logging_config {
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    include_cookies = false
    prefix          = "cloudfront/"
  }

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "frontend-s3"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  origin {
    domain_name = var.api_origin_domain_name
    origin_id   = "api-alb"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "frontend-s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security.id
  }

  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = "api-alb"
    viewer_protocol_policy = "https-only"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type", "X-Api-Key", "Idempotency-Key", "traceparent", "tracestate"]
      cookies {
        forward = "all"
      }
    }
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security.id
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.edge.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

resource "aws_route53_record" "apex_ipv4" {
  name    = var.domain_name
  type    = "A"
  zone_id = aws_route53_zone.primary.zone_id

  alias {
    evaluate_target_health = false
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
  }
}

resource "aws_route53_record" "apex_ipv6" {
  name    = var.domain_name
  type    = "AAAA"
  zone_id = aws_route53_zone.primary.zone_id

  alias {
    evaluate_target_health = false
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
  }
}

resource "aws_route53_record" "www_ipv4" {
  name    = "www.${var.domain_name}"
  type    = "A"
  zone_id = aws_route53_zone.primary.zone_id

  alias {
    evaluate_target_health = false
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
  }
}

resource "aws_route53_record" "www_ipv6" {
  name    = "www.${var.domain_name}"
  type    = "AAAA"
  zone_id = aws_route53_zone.primary.zone_id

  alias {
    evaluate_target_health = false
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
  }
}

# --- Secondary domain (ensemble-retail.com) apex + www -> same CloudFront distribution ---
resource "aws_route53_record" "secondary_apex_ipv4" {
  count   = var.secondary_domain_name != "" ? 1 : 0
  name    = var.secondary_domain_name
  type    = "A"
  zone_id = aws_route53_zone.secondary.zone_id

  alias {
    evaluate_target_health = false
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
  }
}

resource "aws_route53_record" "secondary_apex_ipv6" {
  count   = var.secondary_domain_name != "" ? 1 : 0
  name    = var.secondary_domain_name
  type    = "AAAA"
  zone_id = aws_route53_zone.secondary.zone_id

  alias {
    evaluate_target_health = false
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
  }
}

resource "aws_route53_record" "secondary_www_ipv4" {
  count   = var.secondary_domain_name != "" ? 1 : 0
  name    = "www.${var.secondary_domain_name}"
  type    = "A"
  zone_id = aws_route53_zone.secondary.zone_id

  alias {
    evaluate_target_health = false
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
  }
}

resource "aws_route53_record" "secondary_www_ipv6" {
  count   = var.secondary_domain_name != "" ? 1 : 0
  name    = "www.${var.secondary_domain_name}"
  type    = "AAAA"
  zone_id = aws_route53_zone.secondary.zone_id

  alias {
    evaluate_target_health = false
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
  }
}

# api.<secondary> -> the existing api.<primary> record (which aliases the ALB). The ALB's
# ingress must have a host rule for api.<secondary>, and its ACM cert must include that SAN.
resource "aws_route53_record" "secondary_api" {
  count   = var.secondary_domain_name != "" ? 1 : 0
  name    = "api.${var.secondary_domain_name}"
  type    = "CNAME"
  ttl     = 300
  zone_id = aws_route53_zone.secondary.zone_id
  records = ["api.${var.domain_name}"]
}

data "aws_iam_policy_document" "cloudfront_frontend_read" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.frontend.arn}/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.frontend.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = data.aws_iam_policy_document.cloudfront_frontend_read.json
}
