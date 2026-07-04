data "aws_iam_policy_document" "trust_grafana" {
  statement {
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${var.grafana_account_id}:root"]
    }

    actions = ["sts:AssumeRole"]

    condition {
      test     = "StringEquals"
      variable = "sts:ExternalId"
      values   = [var.external_id]
    }
  }
}

resource "aws_iam_role" "grafana_labs_cloudwatch_integration" {
  name        = var.iam_role_name
  description = "Role used by Grafana CloudWatch integration."

  assume_role_policy = data.aws_iam_policy_document.trust_grafana.json
}

resource "aws_iam_role_policy" "grafana_labs_cloudwatch_integration" {
  name = "GrafanaLabsCloudWatchIntegrationPolicy"
  role = aws_iam_role.grafana_labs_cloudwatch_integration.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "tag:GetResources",
          "cloudwatch:GetMetricData",
          "cloudwatch:ListMetrics",
          "apigateway:GET",
          "aps:ListWorkspaces",
          "autoscaling:DescribeAutoScalingGroups",
          "dms:DescribeReplicationInstances",
          "dms:DescribeReplicationTasks",
          "ec2:DescribeTransitGatewayAttachments",
          "ec2:DescribeSpotFleetRequests",
          "shield:ListProtections",
          "storagegateway:ListGateways",
          "storagegateway:ListTagsForResource",
          "iam:ListAccountAliases"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "time_sleep" "wait_for_iam_propagation" {
  depends_on = [
    aws_iam_role.grafana_labs_cloudwatch_integration,
    aws_iam_role_policy.grafana_labs_cloudwatch_integration
  ]

  create_duration = "10s"
}

resource "grafana_cloud_provider_aws_cloudwatch_scrape_job" "rds" {
  name                    = var.rds_cloudwatch_scrape_job_name
  enabled                 = true
  aws_account_resource_id = var.grafana_aws_account_resource_id
  stack_id                = var.grafana_stack_id
  export_tags             = true

  service {
    name = "AWS/RDS"
    # 900s (15 min) is plenty for capacity dashboards and cuts GetMetricData request volume
    # 3x versus the previous 300s interval, which was pushing the account over its CloudWatch
    # API request free tier.
    scrape_interval_seconds = 900

    # AuroraGlobalDBDataTransferBytes/AuroraGlobalDBProgressLag are Global Database metrics; the
    # "ensemble-inventory" cluster is a single-region Aurora cluster, so those queries always
    # returned empty and were pure wasted CloudWatch API requests. Removed.
    metric {
      name       = "BurstBalance"
      statistics = ["Average"]
    }
    metric {
      name       = "CPUCreditBalance"
      statistics = ["Average"]
    }
    metric {
      name       = "CPUCreditUsage"
      statistics = ["Average"]
    }
    metric {
      name       = "CPUUtilization"
      statistics = ["Maximum", "Average"]
    }
    metric {
      name       = "DatabaseConnections"
      statistics = ["Sum", "Maximum"]
    }
    metric {
      name       = "DBLoad"
      statistics = ["Average"]
    }
    metric {
      name       = "DBLoadCPU"
      statistics = ["Average"]
    }
    metric {
      name       = "DBLoadNonCPU"
      statistics = ["Average"]
    }
    metric {
      name       = "EBSByteBalance%"
      statistics = ["Average"]
    }
    metric {
      name       = "EBSIOBalance%"
      statistics = ["Average"]
    }
    metric {
      name       = "FreeableMemory"
      statistics = ["Average"]
    }
    metric {
      name       = "FreeStorageSpace"
      statistics = ["Average"]
    }
    metric {
      name       = "FreeStorageSpaceLogVolume"
      statistics = ["Average"]
    }
    metric {
      name       = "ReadIOPS"
      statistics = ["Average"]
    }
    metric {
      name       = "ReadLatency"
      statistics = ["Average", "Maximum"]
    }
    metric {
      name       = "ReadThroughput"
      statistics = ["Average"]
    }
    metric {
      name       = "ReplicaLag"
      statistics = ["Average"]
    }
    metric {
      name       = "SwapUsage"
      statistics = ["Average"]
    }
    metric {
      name       = "WriteIOPS"
      statistics = ["Average"]
    }
    metric {
      name       = "WriteLatency"
      statistics = ["Average", "Maximum"]
    }
    metric {
      name       = "WriteThroughput"
      statistics = ["Average"]
    }
  }
}
