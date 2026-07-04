variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "cluster_name" {
  type        = string
  default     = "ensemble-grafana"
  description = "EKS cluster name the observability-apply roles fetch kubeconfig for (must match stacks/cluster's cluster_name)."
}

variable "github_repository" {
  type        = string
  default     = "orenlion1/ensemble-retail"
  description = "GitHub \"owner/repo\" allowed to assume the CI observability-apply roles via OIDC."
}

variable "github_environment" {
  type        = string
  default     = "observability-apply"
  description = "GitHub Actions environment name that gates the apply role. Must have required reviewers configured in repo settings so assuming this role always requires a human approval."
}
