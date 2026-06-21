data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

locals {
  ssm_default_host_management_setting_path = "/ssm/managed-instance/default-ec2-instance-management-role"
  ssm_default_host_management_setting_arn  = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:servicesetting${local.ssm_default_host_management_setting_path}"
}

resource "aws_iam_role" "ssm_default_host_management" {
  name = "AWSSystemsManagerDefaultEC2InstanceManagementRole"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ssm.amazonaws.com" }
    }]
  })

  tags = {
    Stack     = "account-baseline"
    Scope     = "account"
    Owner     = var.owner
    ManagedBy = var.managed_by
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_iam_role_policy_attachment" "ssm_default_host_management" {
  role       = aws_iam_role.ssm_default_host_management.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedEC2InstanceDefaultPolicy"
}

resource "aws_ssm_service_setting" "default_ec2_instance_management_role" {
  setting_id    = local.ssm_default_host_management_setting_arn
  setting_value = aws_iam_role.ssm_default_host_management.name

  depends_on = [aws_iam_role_policy_attachment.ssm_default_host_management]

  lifecycle {
    prevent_destroy = true
  }
}
