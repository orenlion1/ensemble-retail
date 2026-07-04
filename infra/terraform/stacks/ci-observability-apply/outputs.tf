output "observability_plan_role_arn" {
  value       = aws_iam_role.observability_plan.arn
  description = "Put this in the OBSERVABILITY_PLAN_ROLE_ARN repository secret."
}

output "observability_apply_role_arn" {
  value       = aws_iam_role.observability_apply.arn
  description = "Put this in the OBSERVABILITY_APPLY_ROLE_ARN repository secret."
}
