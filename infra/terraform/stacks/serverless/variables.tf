variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "repo_root" {
  type        = string
  description = "Path to the repository root, used to locate built service jars."
  default     = "../../../.."
}

variable "lambda_memory_mb" {
  type        = number
  description = "Memory (and proportional CPU) for each Java service Lambda."
  default     = 1024
}

variable "lambda_timeout_seconds" {
  type    = number
  default = 30
}

variable "reserved_concurrency" {
  type        = number
  description = "Per-function reserved concurrency. Caps blast radius and denial-of-wallet: a flood 429s past this instead of scaling (and billing) without bound."
  default     = 20
}

variable "api_throttle_rate" {
  type        = number
  description = "Steady-state requests/second across the HTTP API stage. Replaces the retired WAF ApiRateLimitPerIp control."
  default     = 50
}

variable "api_throttle_burst" {
  type        = number
  description = "Burst bucket size for the HTTP API stage throttle."
  default     = 100
}

variable "jwt_auth_enabled" {
  type        = string
  description = "Enables the Cognito JWT resource-server filter in each service (defense in depth alongside the API key)."
  default     = "true"
}

variable "cognito_issuer_uri" {
  type        = string
  description = "Cognito user-pool issuer URI for JWT validation."
  default     = ""
}

variable "api_key" {
  type        = string
  description = "Shared API key enforced by the services' ApiKeyAuthenticationFilter."
  sensitive   = true
  default     = ""
}

variable "allowed_cors_origins" {
  type        = string
  description = "Comma-separated storefront origins permitted by service CORS."
  default     = "https://ensemble-grafana.com,https://www.ensemble-grafana.com"
}

variable "otlp_endpoint" {
  type        = string
  description = "Grafana Cloud OTLP traces endpoint. Egresses over the public internet (no VPC/NAT)."
  default     = ""
}

variable "otlp_headers" {
  type        = string
  description = "OTEL_EXPORTER_OTLP_HEADERS value (e.g. Authorization=Basic ...) for Grafana Cloud."
  sensitive   = true
  default     = ""
}

# --- Custom domain (cutover). Off by default so the first apply yields a testable
# execute-api URL; flip to true and supply cert/zone to repoint api.ensemble-grafana.com. ---
variable "enable_custom_domain" {
  type    = bool
  default = false
}

variable "api_domain_name" {
  type    = string
  default = "api.ensemble-grafana.com"
}

variable "acm_certificate_arn" {
  type        = string
  description = "Regional ACM certificate ARN for api_domain_name (us-east-1)."
  default     = ""
}

variable "route53_zone_id" {
  type    = string
  default = ""
}

# Secondary domain (api.ensemble-retail.com). Same ACM cert covers it. Off by default.
variable "enable_retail_domain" {
  type    = bool
  default = false
}

variable "retail_domain_name" {
  type    = string
  default = "api.ensemble-retail.com"
}

variable "retail_route53_zone_id" {
  type    = string
  default = ""
}

# Tertiary domain (api.ensemble-service.com). Same ACM cert covers it. Off by default.
variable "enable_service_domain" {
  type    = bool
  default = false
}

variable "service_domain_name" {
  type    = string
  default = "api.ensemble-service.com"
}

variable "service_route53_zone_id" {
  type    = string
  default = ""
}

variable "budget_notification_email" {
  type        = string
  description = "Email address for the AWS Budgets alarm."
  default     = "orendroid@gmail.com"
}

variable "monthly_budget_usd" {
  type    = number
  default = 15
}
