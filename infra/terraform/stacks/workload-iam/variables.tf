variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "oidc_provider_arn" {
  type        = string
  description = "EKS OIDC provider ARN from the cluster stack."
}

variable "oidc_provider_url" {
  type        = string
  description = "EKS OIDC provider URL from the cluster stack."
}

variable "cart_table_arn" {
  type        = string
  description = "Cart DynamoDB table ARN from the data stack."
}

variable "account_table_arn" {
  type        = string
  description = "Account DynamoDB table ARN from the data stack."
}

variable "app_runtime_secret_arn" {
  type        = string
  description = "Runtime Secrets Manager secret ARN from the data stack."
}
