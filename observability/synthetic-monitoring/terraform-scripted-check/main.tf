terraform {
  required_providers {
    grafana = {
      source  = "grafana/grafana"
      version = "~> 4.0"
    }
  }
}

provider "grafana" {}

data "grafana_synthetic_monitoring_probes" "main" {}

resource "grafana_synthetic_monitoring_check" "scripted" {
  job       = "ensemble-grafana-scripted-storefront-api"
  target    = "https://ensemble-grafana.com"
  enabled   = true
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
      script = file("${path.module}/../ensemble-grafana-scripted-check.js")
    }
  }
}

resource "grafana_synthetic_monitoring_check" "browser_user_actions" {
  job       = "ensemble-grafana-browser-user-actions"
  target    = "https://ensemble-grafana.com"
  enabled   = true
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
      script = file("${path.module}/../ensemble-grafana-browser-action-check.js")
    }
  }
}
