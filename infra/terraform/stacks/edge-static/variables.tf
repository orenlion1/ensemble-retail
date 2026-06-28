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

variable "secondary_domain_name" {
  type        = string
  description = "Additional apex domain served by the same CloudFront distribution / cert. Empty disables."
  default     = "ensemble-retail.com"
}

variable "cognito_domain_prefix" {
  type        = string
  description = "AWS-managed Cognito hosted UI domain prefix used by frontend OAuth token exchange."
  default     = "ensemble-grafana"
}

variable "edge_rate_limit_per_ip" {
  type        = number
  description = "AWS WAF CloudFront rate limit per source IP over the 5-minute evaluation window. Keep high enough for local browser smoke tests."
  default     = 200000

  validation {
    condition     = var.edge_rate_limit_per_ip >= 500 && var.edge_rate_limit_per_ip <= 2000000000
    error_message = "edge_rate_limit_per_ip must be between 500 and the AWS WAF maximum of 2000000000."
  }
}

variable "api_rate_limit_per_ip" {
  type        = number
  description = "AWS WAF API rate limit per source IP over the 5-minute evaluation window. Keep high enough for local k6 smoke tests."
  default     = 200000

  validation {
    condition     = var.api_rate_limit_per_ip >= 500 && var.api_rate_limit_per_ip <= 2000000000
    error_message = "api_rate_limit_per_ip must be between 500 and the AWS WAF maximum of 2000000000."
  }
}
