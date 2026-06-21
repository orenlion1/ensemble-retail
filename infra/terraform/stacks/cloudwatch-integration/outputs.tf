output "role_arn" {
  depends_on = [time_sleep.wait_for_iam_propagation]

  value       = aws_iam_role.grafana_labs_cloudwatch_integration.arn
  description = "ARN of the IAM role to use in Grafana Cloud's AWS CloudWatch metrics integration."
}

output "external_id" {
  value       = var.external_id
  description = "External ID configured for Grafana Cloud to assume the CloudWatch integration role."
}

output "grafana_account_id" {
  value       = var.grafana_account_id
  description = "Grafana Labs AWS account trusted by the CloudWatch integration role."
}

output "rds_cloudwatch_scrape_job_id" {
  value       = grafana_cloud_provider_aws_cloudwatch_scrape_job.rds.id
  description = "Grafana Cloud Provider AWS/RDS CloudWatch scrape job ID."
}
