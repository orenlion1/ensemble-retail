variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "domain_name" {
  type    = string
  default = "ensemble-grafana.com"
}

variable "api_origin_domain_name" {
  type        = string
  description = "DNS name for the API origin behind CloudFront."
  default     = "api.ensemble-grafana.com"
}

variable "cognito_domain_prefix" {
  type        = string
  description = "AWS-managed Cognito hosted UI domain prefix used by frontend OAuth token exchange."
  default     = "ensemble-grafana"
}
