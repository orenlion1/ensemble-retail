variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "cluster_name" {
  type    = string
  default = "ensemble-grafana"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs from the network stack."
}

variable "public_subnet_ids" {
  type        = list(string)
  description = "Public subnet IDs from the network stack."
}
