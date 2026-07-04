data "aws_caller_identity" "current" {}

# Reused from the existing deploy pipeline's OIDC setup rather than recreated: AWS allows only
# one OIDC provider per issuer URL per account, and the "Deploy" workflow already federates
# GitHub Actions via this same provider.
data "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"
}

locals {
  # stacks/cluster's own resources. `terraform plan`/`apply` refreshes every resource in a
  # stack's state, not just the ones a given change touches, so these roles need to read (and,
  # for apply, update-in-place) the whole cluster stack -- not just the logging config that
  # motivated this workflow. Node group / cluster create-or-delete is deliberately withheld
  # below so a CI-triggered replace fails closed instead of recreating live infrastructure.
  eks_cluster_arn      = "arn:aws:eks:${var.aws_region}:${data.aws_caller_identity.current.account_id}:cluster/${var.cluster_name}"
  eks_nodegroup_arn    = "arn:aws:eks:${var.aws_region}:${data.aws_caller_identity.current.account_id}:nodegroup/${var.cluster_name}/${var.node_group_name}/*"
  eks_cluster_role_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.cluster_name}-eks-cluster"
  eks_nodes_role_arn   = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.cluster_name}-eks-nodes"
  eks_oidc_provider_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/oidc.eks.${var.aws_region}.amazonaws.com/id/*"
  eks_log_group_arn = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/eks/${var.cluster_name}/cluster*"
  # logs:DescribeLogGroups is a list API: IAM evaluates it against log-group:* rather than the
  # log group named in the request, so it cannot be scoped tighter than this. It only exposes
  # log-group metadata (names/retention), never log contents.
  log_group_describe_arn = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:*"

  # stacks/cloudwatch-integration's own resource.
  grafana_role_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/GrafanaLabsCloudWatchIntegration"

  state_bucket_name = var.state_bucket_name != "" ? var.state_bucket_name : "ensemble-grafana-tf-state-${data.aws_caller_identity.current.account_id}"
  lock_table_name   = var.lock_table_name != "" ? var.lock_table_name : "ensemble-grafana-tf-locks"

  # The exact state objects the CI roles may touch. Everything else in the bucket (e.g. a future
  # stacks/data state, which would contain the DB master password) stays unreadable from CI.
  ci_state_key_arns = [
    "${aws_s3_bucket.tf_state.arn}/stacks/cluster/terraform.tfstate",
    "${aws_s3_bucket.tf_state.arn}/stacks/cloudwatch-integration/terraform.tfstate",
  ]
}

# --- Terraform state backend, shared by local operator runs and CI. Owned here (with local
# --- state) because this is the bootstrap stack: it must be applied once by a human with real
# --- credentials before any CI run can work, so it can't depend on the backend it creates. ---

resource "aws_s3_bucket" "tf_state" {
  bucket = local.state_bucket_name

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "tf_state" {
  bucket                  = aws_s3_bucket.tf_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "tf_locks" {
  name         = local.lock_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# --- Plan role: read-only, assumable by any workflow run on this repo. Safe to use without
# --- a human in the loop since it can only describe state, never mutate it. ---

data "aws_iam_policy_document" "trust_github_actions_any_run" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github_actions.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:*"]
    }
  }
}

resource "aws_iam_role" "terraform_plan" {
  name                 = "ensemble-grafana-terraform-plan"
  description          = "Read-only role for `terraform plan` in the guarded Terraform-apply workflow. Assumable by any workflow run on this repo."
  assume_role_policy   = data.aws_iam_policy_document.trust_github_actions_any_run.json
  max_session_duration = 3600
}

resource "aws_iam_role_policy" "terraform_plan" {
  name = "TerraformPlanReadOnly"
  role = aws_iam_role.terraform_plan.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "EksClusterRead"
        Effect   = "Allow"
        Action   = ["eks:DescribeCluster", "eks:ListTagsForResource"]
        Resource = local.eks_cluster_arn
      },
      {
        Sid      = "EksNodegroupRead"
        Effect   = "Allow"
        Action   = ["eks:DescribeNodegroup", "eks:ListTagsForResource"]
        Resource = local.eks_nodegroup_arn
      },
      {
        Sid    = "EksIamRolesRead"
        Effect = "Allow"
        Action = [
          "iam:GetRole",
          "iam:ListRolePolicies",
          "iam:ListAttachedRolePolicies"
        ]
        Resource = [local.eks_cluster_role_arn, local.eks_nodes_role_arn]
      },
      {
        Sid      = "EksOidcProviderRead"
        Effect   = "Allow"
        Action   = ["iam:GetOpenIDConnectProvider"]
        Resource = local.eks_oidc_provider_arn
      },
      {
        Sid      = "CloudWatchLogGroupDescribe"
        Effect   = "Allow"
        Action   = ["logs:DescribeLogGroups"]
        Resource = local.log_group_describe_arn
      },
      {
        Sid      = "CloudWatchLogGroupRead"
        Effect   = "Allow"
        Action   = ["logs:ListTagsForResource"]
        Resource = local.eks_log_group_arn
      },
      {
        # ListAttachedRolePolicies included because the AWS provider's aws_iam_role refresh
        # reads managed-policy attachments even when the config declares none.
        Sid    = "GrafanaCloudWatchIntegrationRoleRead"
        Effect = "Allow"
        Action = [
          "iam:GetRole",
          "iam:GetRolePolicy",
          "iam:ListRolePolicies",
          "iam:ListAttachedRolePolicies"
        ]
        Resource = local.grafana_role_arn
      },
      {
        Sid      = "StateBucketList"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = aws_s3_bucket.tf_state.arn
      },
      {
        Sid      = "StateObjectsRead"
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = local.ci_state_key_arns
      },
      {
        # plan acquires and releases the state lock too, not just apply
        Sid      = "StateLocking"
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem"]
        Resource = aws_dynamodb_table.tf_locks.arn
      },
      {
        Sid      = "CallerIdentity"
        Effect   = "Allow"
        Action   = ["sts:GetCallerIdentity"]
        Resource = "*"
      }
    ]
  })
}

# --- Apply role: read+write, but only assumable when the calling job runs under the protected
# --- "terraform-apply" GitHub environment. Configure that environment with required reviewers
# --- in repo settings so this role can never be assumed without a human approving first. ---

data "aws_iam_policy_document" "trust_github_actions_guarded_environment" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github_actions.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:environment:${var.github_environment}"]
    }
  }
}

resource "aws_iam_role" "terraform_apply" {
  name                 = "ensemble-grafana-terraform-apply"
  description          = "Read+write role for `terraform apply` in the guarded Terraform-apply workflow. Scoped to the named resources in stacks/cluster and stacks/cloudwatch-integration only (cannot create/delete the EKS cluster or node group); only assumable from the required-reviewer-gated \"${var.github_environment}\" GitHub environment."
  assume_role_policy   = data.aws_iam_policy_document.trust_github_actions_guarded_environment.json
  max_session_duration = 3600
}

resource "aws_iam_role_policy" "terraform_apply" {
  name = "TerraformApplyScoped"
  role = aws_iam_role.terraform_apply.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Deliberately no eks:CreateCluster/DeleteCluster: if a plan ever wants to replace the
        # live cluster, apply should fail closed rather than tear it down via CI.
        # eks:DescribeUpdate is how Terraform polls an in-flight UpdateClusterConfig to
        # completion -- without it the update is submitted but the apply errors mid-wait.
        Sid    = "EksClusterInPlaceUpdate"
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster",
          "eks:UpdateClusterConfig",
          "eks:DescribeUpdate",
          "eks:ListTagsForResource",
          "eks:TagResource",
          "eks:UntagResource"
        ]
        Resource = local.eks_cluster_arn
      },
      {
        # Deliberately no eks:CreateNodegroup/DeleteNodegroup, same reasoning as above.
        Sid    = "EksNodegroupInPlaceUpdate"
        Effect = "Allow"
        Action = [
          "eks:DescribeNodegroup",
          "eks:UpdateNodegroupConfig",
          "eks:DescribeUpdate",
          "eks:ListTagsForResource",
          "eks:TagResource",
          "eks:UntagResource"
        ]
        Resource = local.eks_nodegroup_arn
      },
      {
        Sid    = "EksIamRolesManage"
        Effect = "Allow"
        Action = [
          "iam:GetRole",
          "iam:CreateRole",
          "iam:DeleteRole",
          "iam:TagRole",
          "iam:UntagRole",
          "iam:ListRolePolicies",
          "iam:ListAttachedRolePolicies",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:UpdateAssumeRolePolicy"
        ]
        Resource = [local.eks_cluster_role_arn, local.eks_nodes_role_arn]
      },
      {
        Sid    = "EksOidcProviderManage"
        Effect = "Allow"
        Action = [
          "iam:GetOpenIDConnectProvider",
          "iam:CreateOpenIDConnectProvider",
          "iam:UpdateOpenIDConnectProviderThumbprint",
          "iam:TagOpenIDConnectProvider"
        ]
        Resource = local.eks_oidc_provider_arn
      },
      {
        Sid      = "CloudWatchLogGroupDescribe"
        Effect   = "Allow"
        Action   = ["logs:DescribeLogGroups"]
        Resource = local.log_group_describe_arn
      },
      {
        Sid    = "CloudWatchLogGroup"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:DeleteLogGroup",
          "logs:PutRetentionPolicy",
          "logs:ListTagsForResource",
          "logs:TagResource",
          "logs:UntagResource"
        ]
        Resource = local.eks_log_group_arn
      },
      {
        Sid    = "GrafanaCloudWatchIntegrationRole"
        Effect = "Allow"
        Action = [
          "iam:CreateRole",
          "iam:DeleteRole",
          "iam:GetRole",
          "iam:PutRolePolicy",
          "iam:GetRolePolicy",
          "iam:DeleteRolePolicy",
          "iam:ListRolePolicies",
          "iam:ListAttachedRolePolicies",
          "iam:TagRole"
        ]
        Resource = local.grafana_role_arn
      },
      {
        Sid      = "StateBucketList"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = aws_s3_bucket.tf_state.arn
      },
      {
        Sid      = "StateObjectsReadWrite"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject"]
        Resource = local.ci_state_key_arns
      },
      {
        Sid      = "StateLocking"
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem"]
        Resource = aws_dynamodb_table.tf_locks.arn
      },
      {
        Sid      = "CallerIdentity"
        Effect   = "Allow"
        Action   = ["sts:GetCallerIdentity"]
        Resource = "*"
      }
    ]
  })
}
