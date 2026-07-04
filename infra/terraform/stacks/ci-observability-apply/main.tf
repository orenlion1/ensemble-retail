data "aws_caller_identity" "current" {}

# Reused from stacks/ci-terraform-apply rather than recreated: AWS allows only one OIDC provider
# per issuer URL per account, and that stack (and the Deploy workflow before it) already
# federates GitHub Actions via this same provider.
data "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"
}

locals {
  eks_cluster_arn = "arn:aws:eks:${var.aws_region}:${data.aws_caller_identity.current.account_id}:cluster/${var.cluster_name}"
}

# --- Plan role: only reads a kubeconfig, assumable by any workflow run on this repo. Real
# --- authorization is enforced entirely by Kubernetes RBAC (infra/k8s/observability-apply-rbac.yaml)
# --- once the aws-auth ConfigMap maps this role to the ensemble-observability-planners group --
# --- eks:DescribeCluster on its own only lets `aws eks update-kubeconfig` populate a kubeconfig,
# --- it grants no in-cluster access by itself. ---

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

resource "aws_iam_role" "observability_plan" {
  name                 = "ensemble-grafana-observability-plan"
  description          = "Read-only role for `kubectl diff` in the guarded Observability Apply workflow. Assumable by any workflow run on this repo; mapped (via the operator-managed aws-auth ConfigMap) to the ensemble-observability-planners Kubernetes group, which grants only get/list/watch on the alloy-config/pyroscope-alloy-config ConfigMaps and the alloy Deployment/pyroscope-alloy DaemonSet in the ensemble-observability namespace."
  assume_role_policy   = data.aws_iam_policy_document.trust_github_actions_any_run.json
  max_session_duration = 3600
}

resource "aws_iam_role_policy" "observability_plan" {
  name = "ObservabilityPlanKubeconfig"
  role = aws_iam_role.observability_plan.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "EksDescribeForKubeconfig"
        Effect   = "Allow"
        Action   = ["eks:DescribeCluster"]
        Resource = local.eks_cluster_arn
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

# --- Apply role: same AWS-side permission as plan -- eks:DescribeCluster is all `kubectl` ever
# --- needs from IAM, since actual write authorization lives in Kubernetes RBAC, not IAM policy --
# --- but only assumable when the calling job runs under the protected "observability-apply"
# --- GitHub environment. Configure that environment with required reviewers in repo settings so
# --- this role can never be assumed without a human approving first. ---

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

resource "aws_iam_role" "observability_apply" {
  name                 = "ensemble-grafana-observability-apply"
  description          = "Role for `kubectl apply` in the guarded Observability Apply workflow. Only assumable from the required-reviewer-gated \"${var.github_environment}\" GitHub environment; mapped (via the operator-managed aws-auth ConfigMap) to the ensemble-observability-appliers Kubernetes group, which grants only get/list/watch/patch on the alloy-config/pyroscope-alloy-config ConfigMaps and the alloy Deployment/pyroscope-alloy DaemonSet in the ensemble-observability namespace -- it cannot touch anything else in the cluster."
  assume_role_policy   = data.aws_iam_policy_document.trust_github_actions_guarded_environment.json
  max_session_duration = 3600
}

resource "aws_iam_role_policy" "observability_apply" {
  name = "ObservabilityApplyKubeconfig"
  role = aws_iam_role.observability_apply.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "EksDescribeForKubeconfig"
        Effect   = "Allow"
        Action   = ["eks:DescribeCluster"]
        Resource = local.eks_cluster_arn
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
