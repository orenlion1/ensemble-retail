variable "aws_region" {
  type        = string
  description = "Region for the state backend and the CI OIDC roles."
  default     = "us-east-1"
}

# ---- CI (GitHub Actions -> AWS via OIDC for state; Grafana token for the provider; see ci.tf) ----

variable "github_repository" {
  type        = string
  description = "owner/name. Pins the OIDC trust policies in ci.tf to this repo."
  default     = "orenlion1/ensemble-retail"
}

variable "github_environment" {
  type        = string
  description = <<-EOT
    GitHub environment that gates `terraform apply`. Configure it with required
    reviewers in repo settings: the apply role cannot be assumed from anywhere
    else, so no CI run can mutate the checks without a human approving first.
  EOT
  default     = "terraform-apply"
}
