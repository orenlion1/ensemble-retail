variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "domain_name" {
  type    = string
  default = "ensemble-grafana.com"
}

variable "cognito_domain_prefix" {
  type        = string
  description = "AWS-managed Cognito hosted UI domain prefix. Must be globally unique in the AWS region."
  default     = "ensemble-grafana"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the Ensemble-Retail VPC."
  default     = "10.42.0.0/16"
}

variable "availability_zone_count" {
  type        = number
  description = "Number of availability zones to use for public/private subnets."
  default     = 2
}

variable "provision_network" {
  type        = bool
  description = "Whether this root stack should create network resources. Set false when using stacks/network as the network state."
  default     = true
}

variable "vpc_id" {
  type        = string
  description = "Existing VPC ID to use when provision_network is false."
  default     = null
}

variable "public_subnet_ids" {
  type        = list(string)
  description = "Existing public subnet IDs to use when provision_network is false."
  default     = null
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Existing private subnet IDs to use when provision_network is false."
  default     = null
}

variable "google_client_id" {
  type      = string
  sensitive = true
}

variable "google_client_secret" {
  type      = string
  sensitive = true
}

variable "inventory_db_password" {
  type      = string
  sensitive = true
}
