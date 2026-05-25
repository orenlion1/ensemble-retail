output "cart_table_arn" {
  value = aws_dynamodb_table.carts.arn
}

output "account_table_arn" {
  value = aws_dynamodb_table.accounts.arn
}

output "cart_table_name" {
  value = aws_dynamodb_table.carts.name
}

output "account_table_name" {
  value = aws_dynamodb_table.accounts.name
}

output "inventory_cluster_arn" {
  value = aws_rds_cluster.inventory.arn
}

output "inventory_cluster_endpoint" {
  value = aws_rds_cluster.inventory.endpoint
}

output "app_runtime_secret_arn" {
  value = aws_secretsmanager_secret.app_runtime.arn
}
