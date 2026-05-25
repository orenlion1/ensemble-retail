output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = local.public_subnet_ids
}

output "private_subnet_ids" {
  value = local.private_subnet_ids
}

output "availability_zones" {
  value = local.availability_zones
}
