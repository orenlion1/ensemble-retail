terraform {
  required_providers {
    grafana = {
      source  = "grafana/grafana"
      version = "~> 4.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state in the shared bucket that core-infra's stacks/ci-terraform-apply
  # owns (ensemble-grafana-tf-state-<account>), key stacks/ensemble-retail-synthetics.
  # bucket/region/use_lockfile come from -backend-config at init (see the
  # synthetics-apply workflow / README). S3-native locking, no DynamoDB table.
  backend "s3" {
    key     = "stacks/ensemble-retail-synthetics/terraform.tfstate"
    encrypt = true
  }
}

# Grafana provider auth comes from the environment (GRAFANA_URL/GRAFANA_AUTH and
# GRAFANA_SM_URL/GRAFANA_SM_ACCESS_TOKEN), injected in CI from repo secrets — the
# non-AWS half of the orenlion1 Terraform-in-CI standard.
provider "grafana" {}

# AWS is used only for the state backend and to define this stack's own CI OIDC
# roles (ci.tf). No AWS resources are created for the checks themselves.
provider "aws" {
  region = var.aws_region
}

data "grafana_synthetic_monitoring_probes" "main" {}

resource "grafana_synthetic_monitoring_check" "scripted" {
  job       = "ensemble-grafana-scripted-storefront-api"
  target    = "https://ensemble-retail.com"
  enabled   = false
  frequency = 60000
  timeout   = 10000

  probes = [
    data.grafana_synthetic_monitoring_probes.main.probes["Oregon"],
    data.grafana_synthetic_monitoring_probes.main.probes["Montreal"],
    data.grafana_synthetic_monitoring_probes.main.probes["London"],
  ]

  labels = {
    environment = "production"
    service     = "storefront-api"
    check_type  = "scripted"
  }

  settings {
    scripted {
      script = file("${path.module}/../ensemble-retail-scripted-check.js")
    }
  }
}

resource "grafana_synthetic_monitoring_check" "browser_user_actions" {
  job       = "ensemble-grafana-browser-user-actions"
  target    = "https://ensemble-retail.com"
  enabled   = false
  frequency = 300000
  timeout   = 180000

  probes = [
    data.grafana_synthetic_monitoring_probes.main.probes["Oregon"],
    data.grafana_synthetic_monitoring_probes.main.probes["Montreal"],
    data.grafana_synthetic_monitoring_probes.main.probes["London"],
  ]

  labels = {
    environment = "production"
    service     = "storefront"
    check_type  = "browser"
    coverage    = "user-actions"
  }

  settings {
    browser {
      script = file("${path.module}/../ensemble-retail-browser-action-check.js")
    }
  }
}
