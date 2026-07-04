output "terraform_plan_role_arn" {
  value       = aws_iam_role.terraform_plan.arn
  description = "Put this in the TERRAFORM_PLAN_ROLE_ARN repository secret."
}

output "terraform_apply_role_arn" {
  value       = aws_iam_role.terraform_apply.arn
  description = "Put this in the TERRAFORM_APPLY_ROLE_ARN repository secret."
}
