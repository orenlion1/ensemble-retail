################################################################################
# GitHub Actions -> AWS, via OIDC. No AWS access keys exist anywhere.
#
# This stack's resources are Grafana Synthetic Monitoring checks, authenticated
# with a Grafana Cloud token (env, from repo secrets). AWS is used only for the
# S3 state backend, so these two OIDC roles grant just STATE access — following
# the orenlion1 standard (core-infra docs/standards/terraform-ci-oidc.md), the
# non-AWS-provider adaptation:
#
#   terraform_plan   read-only state, assumable by ANY run. Safe on PRs.
#   terraform_apply  read/write state, assumable ONLY from the required-reviewer
#                    "terraform-apply" environment. The Grafana mutation still
#                    requires the apply role's state lock, so a run cannot change
#                    the checks without a human approving the environment.
#
# The role ARNs are not secrets: the trust policy pins the OIDC subject to this
# repo. Published as repo variables (AWS_PLAN_ROLE_ARN / AWS_APPLY_ROLE_ARN); the
# workflow skips until they are set (first apply is bootstrapped from a laptop).
################################################################################

data "aws_caller_identity" "current" {}

# AWS permits exactly ONE OIDC provider per issuer per account; it already exists.
data "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"
}

locals {
  account_id = data.aws_caller_identity.current.account_id

  tf_state_bucket     = "ensemble-grafana-tf-state-${local.account_id}"
  tf_state_bucket_arn = "arn:aws:s3:::${local.tf_state_bucket}"
  tf_state_obj_arn    = "arn:aws:s3:::${local.tf_state_bucket}/stacks/ensemble-retail-synthetics/terraform.tfstate"
  tf_lock_obj_arn     = "arn:aws:s3:::${local.tf_state_bucket}/stacks/ensemble-retail-synthetics/terraform.tfstate.tflock"

  # This stack manages only its own two CI roles on the AWS side.
  managed_role_arns = "arn:aws:iam::${local.account_id}:role/ensemble-retail-synthetics-terraform-*"
}

# ---- plan: read-only state, any run on this repo ----

data "aws_iam_policy_document" "trust_any_run" {
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
  name                 = "ensemble-retail-synthetics-terraform-plan"
  description          = "Read-only state access for `terraform plan` of the ensemble-retail synthetic checks. Assumable by any run."
  assume_role_policy   = data.aws_iam_policy_document.trust_any_run.json
  max_session_duration = 3600
}

resource "aws_iam_role_policy" "terraform_plan" {
  # checkov:skip=CKV_AWS_287:iam:Get*/List* return role metadata, never credentials; Terraform must refresh the roles it manages.
  name = "TerraformPlanStateReadOnly"
  role = aws_iam_role.terraform_plan.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DescribeOwnRoles"
        Effect = "Allow"
        Action = [
          "iam:GetRole",
          "iam:GetRolePolicy",
          "iam:ListRolePolicies",
          "iam:ListAttachedRolePolicies",
          "iam:ListRoleTags",
          "iam:GetOpenIDConnectProvider",
          "sts:GetCallerIdentity"
        ]
        Resource = "*"
      },
      {
        Sid      = "StateBucketList"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = local.tf_state_bucket_arn
      },
      {
        Sid      = "StateObjectRead"
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = local.tf_state_obj_arn
      },
      {
        Sid      = "StateLockFile"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = local.tf_lock_obj_arn
      }
    ]
  })
}

# ---- apply: read/write state + manage own roles, only from the guarded environment ----

data "aws_iam_policy_document" "trust_guarded_environment" {
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
    # StringEquals, not StringLike: exactly this repo in exactly this environment.
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:environment:${var.github_environment}"]
    }
  }
}

resource "aws_iam_role" "terraform_apply" {
  name                 = "ensemble-retail-synthetics-terraform-apply"
  description          = "Read/write state + own-role management for `terraform apply` of the ensemble-retail synthetic checks. Only assumable from the required-reviewer \"${var.github_environment}\" environment."
  assume_role_policy   = data.aws_iam_policy_document.trust_guarded_environment.json
  max_session_duration = 3600
}

resource "aws_iam_role_policy" "terraform_apply" {
  # checkov:skip=CKV_AWS_287:iam:Get*/List* return role metadata, never credentials.
  name = "TerraformApplyStateScoped"
  role = aws_iam_role.terraform_apply.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Manage only this stack's own two CI roles (ensemble-retail-synthetics-terraform-*).
        Sid    = "ManageOwnRoles"
        Effect = "Allow"
        Action = [
          "iam:CreateRole",
          "iam:DeleteRole",
          "iam:GetRole",
          "iam:TagRole",
          "iam:UntagRole",
          "iam:PutRolePolicy",
          "iam:GetRolePolicy",
          "iam:DeleteRolePolicy",
          "iam:ListRolePolicies",
          "iam:ListAttachedRolePolicies",
          "iam:ListRoleTags",
          "iam:UpdateAssumeRolePolicy"
        ]
        Resource = local.managed_role_arns
      },
      {
        Sid      = "DescribeOidc"
        Effect   = "Allow"
        Action   = ["iam:GetOpenIDConnectProvider", "sts:GetCallerIdentity"]
        Resource = "*"
      },
      {
        Sid      = "StateBucketList"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = local.tf_state_bucket_arn
      },
      {
        Sid      = "StateObjectReadWrite"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject"]
        Resource = local.tf_state_obj_arn
      },
      {
        Sid      = "StateLockFile"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = local.tf_lock_obj_arn
      }
    ]
  })
}

output "terraform_plan_role_arn" {
  description = "Set as the AWS_PLAN_ROLE_ARN repo variable."
  value       = aws_iam_role.terraform_plan.arn
}

output "terraform_apply_role_arn" {
  description = "Set as the AWS_APPLY_ROLE_ARN repo variable."
  value       = aws_iam_role.terraform_apply.arn
}
