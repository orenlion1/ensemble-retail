variable "name" {
  type        = string
  description = "Name prefix used for network resources and Kubernetes discovery tags."
  default     = "ensemble-grafana"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC."
  default     = "10.42.0.0/16"
}

variable "availability_zone_count" {
  type        = number
  description = "Number of availability zones to use for public/private subnets."
  default     = 2
}
