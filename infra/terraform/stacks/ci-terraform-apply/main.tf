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
  eks_log_group_arn    = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/eks/${var.cluster_name}/cluster*"

  # stacks/cloudwatch-integration's own resource.
  grafana_role_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/GrafanaLabsCloudWatchIntegration"
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
        Sid    = "CloudWatchLogGroupRead"
        Effect = "Allow"
        Action = [
          "logs:DescribeLogGroups",
          "logs:ListTagsForResource"
        ]
        Resource = local.eks_log_group_arn
      },
      {
        Sid      = "GrafanaCloudWatchIntegrationRoleRead"
        Effect   = "Allow"
        Action   = ["iam:GetRole", "iam:GetRolePolicy", "iam:ListRolePolicies"]
        Resource = local.grafana_role_arn
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
        Sid    = "EksClusterInPlaceUpdate"
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster",
          "eks:UpdateClusterConfig",
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
        Sid    = "CloudWatchLogGroup"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:DeleteLogGroup",
          "logs:DescribeLogGroups",
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
          "iam:TagRole"
        ]
        Resource = local.grafana_role_arn
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
