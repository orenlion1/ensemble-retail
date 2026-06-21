variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the Ensemble-Grafana VPC."
  default     = "10.42.0.0/16"
}

variable "availability_zone_count" {
  type        = number
  description = "Number of availability zones to use for public/private subnets."
  default     = 2
}
