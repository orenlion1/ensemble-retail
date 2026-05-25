variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "vpc_id" {
  type        = string
  description = "VPC ID from the network stack."
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs from the network stack."
}

variable "eks_cluster_security_group_id" {
  type        = string
  description = "EKS cluster security group ID from the cluster stack."
}

variable "inventory_db_password" {
  type      = string
  sensitive = true
}
