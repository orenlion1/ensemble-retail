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
  setting_id    = "/ssm/managed-instance/default-ec2-instance-management-role"
  setting_value = aws_iam_role.ssm_default_host_management.name

  depends_on = [aws_iam_role_policy_attachment.ssm_default_host_management]

  lifecycle {
    prevent_destroy = true
  }
}
