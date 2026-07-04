terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.12"
    }
    grafana = {
      source  = "grafana/grafana"
      version = "~> 4.36"
    }
  }

  # Partial config: bucket/key/region/dynamodb_table are supplied via -backend-config at init
  # time (see .github/workflows/terraform-apply.yml and stacks/README.md) so state persists
  # across CI runs instead of living only on one operator's machine.
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}

provider "grafana" {
  cloud_provider_url = var.grafana_cloud_provider_url
}
