variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "owner" {
  type        = string
  description = "Owning team for this account-level baseline stack."
  default     = "platform"
}

variable "managed_by" {
  type        = string
  description = "Automation or workflow responsible for applying this stack."
  default     = "terraform-account-baseline-pipeline"
}
