variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "domain_name" {
  type    = string
  default = "ensemble-grafana.com"
}

variable "cognito_domain_prefix" {
  type        = string
  description = "AWS-managed Cognito hosted UI domain prefix. Must be globally unique in the AWS region."
  default     = "ensemble-grafana"
}

variable "google_client_id" {
  type      = string
  sensitive = true
}

variable "google_client_secret" {
  type      = string
  sensitive = true
}
