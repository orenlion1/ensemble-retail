output "terraform_plan_role_arn" {
  value       = aws_iam_role.terraform_plan.arn
  description = "Put this in the TERRAFORM_PLAN_ROLE_ARN repository secret."
}

output "terraform_apply_role_arn" {
  value       = aws_iam_role.terraform_apply.arn
  description = "Put this in the TERRAFORM_APPLY_ROLE_ARN repository secret."
}

output "state_bucket" {
  value       = aws_s3_bucket.tf_state.bucket
  description = "Put this in the TF_BACKEND_BUCKET repository variable; also the -backend-config bucket for local runs."
}

output "lock_table" {
  value       = aws_dynamodb_table.tf_locks.name
  description = "Put this in the TF_BACKEND_DYNAMODB_TABLE repository variable; also the -backend-config dynamodb_table for local runs."
}
