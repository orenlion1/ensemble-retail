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

variable "grafana_stack_id" {
  type        = string
  default     = "1665320"
  description = "Grafana Cloud stack ID that owns the CloudWatch scrape job."

  validation {
    condition     = can(regex("^[0-9]+$", var.grafana_stack_id))
    error_message = "grafana_stack_id must be numeric."
  }
}

variable "grafana_cloud_provider_url" {
  type        = string
  default     = "https://cloud-provider-api-prod-us-east-3.grafana.net"
  description = "Regional Grafana Cloud Provider Observability API URL for the stack."

  validation {
    condition     = can(regex("^https://cloud-provider-api-[A-Za-z0-9-]+\\.grafana\\.net$", var.grafana_cloud_provider_url))
    error_message = "grafana_cloud_provider_url must be a Grafana Cloud Provider API URL."
  }
}

variable "grafana_aws_account_resource_id" {
  type        = string
  default     = "270"
  description = "Grafana Cloud Provider AWS account resource ID associated with the AWS integration."

  validation {
    condition     = can(regex("^[0-9]+$", var.grafana_aws_account_resource_id))
    error_message = "grafana_aws_account_resource_id must be numeric."
  }
}

variable "rds_cloudwatch_scrape_job_name" {
  type        = string
  default     = "ensemble-grafana-rds-cloudwatch"
  description = "Name of the Grafana Cloud AWS/RDS CloudWatch scrape job."
}
