variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "external_id" {
  type        = string
  description = "Grafana Cloud Prometheus username / instance ID used as the AWS STS ExternalId."

  validation {
    condition     = length(var.external_id) > 0
    error_message = "external_id is required."
  }
}

variable "grafana_account_id" {
  type        = string
  default     = "008923505280"
  description = "Grafana Labs AWS account ID allowed to assume the CloudWatch integration role."

  validation {
    condition     = can(regex("^[0-9]{12}$", var.grafana_account_id))
    error_message = "grafana_account_id must be a 12-digit AWS account ID."
  }
}

variable "iam_role_name" {
  type        = string
  default     = "GrafanaLabsCloudWatchIntegration"
  description = "Name of the IAM role used by Grafana Cloud for the CloudWatch metrics integration."
}
