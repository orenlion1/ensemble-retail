output "ssm_default_host_management_role_name" {
  value       = aws_iam_role.ssm_default_host_management.name
  description = "IAM role name configured for the account-wide SSM default EC2 host-management setting."
}

output "ssm_default_host_management_service_setting_id" {
  value       = aws_ssm_service_setting.default_ec2_instance_management_role.setting_id
  description = "Account-wide SSM service setting ID managed by this stack."
}
