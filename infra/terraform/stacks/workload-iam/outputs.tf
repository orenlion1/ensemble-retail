output "inventory_service_role_arn" {
  value = aws_iam_role.inventory_service.arn
}

output "cart_service_role_arn" {
  value = aws_iam_role.cart_service.arn
}

output "account_service_role_arn" {
  value = aws_iam_role.account_service.arn
}
