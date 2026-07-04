#!/usr/bin/env bash

# One-time local bootstrap for the guarded "Observability Apply" GitHub Actions workflow
# (.github/workflows/observability-apply.yml). Run from anywhere inside the repo with real AWS
# and kubectl credentials against the live cluster, and an authenticated gh CLI. Idempotent: safe
# to re-run after a partial failure.
#
# What it does, in order:
#   1. Applies infra/terraform/stacks/ci-observability-apply (the two OIDC IAM roles the
#      workflow assumes). This stack keeps local state on purpose, same reasoning as
#      ci-terraform-apply: it is a bootstrap root of trust for its own guarded workflow.
#   2. Applies infra/k8s/observability-apply-rbac.yaml -- the Role/RoleBinding pair scoped to the
#      alloy-config/pyroscope-alloy-config ConfigMaps and the alloy Deployment/pyroscope-alloy
#      DaemonSet in the ensemble-observability namespace.
#   3. Maps both new IAM roles into the kube-system aws-auth ConfigMap, to the
#      ensemble-observability-planners / ensemble-observability-appliers Kubernetes groups.
#      Additive: existing mappings (e.g. ensemble-retail-deployers) are left untouched.
#   4. Creates the "observability-apply" GitHub environment with the current gh user as required
#      reviewer, restricted to the main branch.
#   5. Sets the OBSERVABILITY_PLAN_ROLE_ARN / OBSERVABILITY_APPLY_ROLE_ARN repository secrets the
#      workflow reads (EKS_CLUSTER_NAME is already set for the existing Deploy workflow).

set -euo pipefail

EXPECTED_AWS_ACCOUNT_ID="${EXPECTED_AWS_ACCOUNT_ID:-629513454417}"
export AWS_REGION="${AWS_REGION:-us-east-1}"
export AWS_DEFAULT_REGION="$AWS_REGION"
CLUSTER_NAME="${CLUSTER_NAME:-ensemble-grafana}"

for tool in aws terraform gh kubectl jq git; do
  command -v "$tool" >/dev/null 2>&1 || { echo "Refusing to run: '$tool' is required." >&2; exit 1; }
done

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"
STACKS_DIR="infra/terraform/stacks"

ACTUAL_AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
if [[ "$ACTUAL_AWS_ACCOUNT_ID" != "$EXPECTED_AWS_ACCOUNT_ID" ]]; then
  echo "Refusing to run: caller account '$ACTUAL_AWS_ACCOUNT_ID' does not match expected '$EXPECTED_AWS_ACCOUNT_ID' (override with EXPECTED_AWS_ACCOUNT_ID)." >&2
  exit 1
fi

GH_REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"

echo "AWS account:    $ACTUAL_AWS_ACCOUNT_ID ($AWS_REGION)"
echo "GitHub repo:    $GH_REPO"
echo "EKS cluster:    $CLUSTER_NAME"
echo "This will create two IAM roles, apply infra/k8s/observability-apply-rbac.yaml, patch the"
echo "kube-system aws-auth ConfigMap (additive), and configure the observability-apply GitHub"
echo "environment and secrets."
read -r -p "Proceed? (yes/no) " answer
[[ "$answer" == "yes" ]] || { echo "Aborted."; exit 1; }

# --- 1. Bootstrap stack: the two OIDC IAM roles (local state, interactive approve) ---
echo
echo "==> Applying $STACKS_DIR/ci-observability-apply (review the plan; Terraform will prompt)"
terraform -chdir="$STACKS_DIR/ci-observability-apply" init -input=false
terraform -chdir="$STACKS_DIR/ci-observability-apply" apply

PLAN_ROLE_ARN="$(terraform -chdir="$STACKS_DIR/ci-observability-apply" output -raw observability_plan_role_arn)"
APPLY_ROLE_ARN="$(terraform -chdir="$STACKS_DIR/ci-observability-apply" output -raw observability_apply_role_arn)"

# --- 2. RBAC: Role/RoleBinding pair scoped to the two ConfigMaps + alloy/pyroscope-alloy ---
echo
echo "==> Applying infra/k8s/observability-apply-rbac.yaml"
aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$AWS_REGION" >/dev/null
kubectl apply -f infra/k8s/observability-apply-rbac.yaml

# --- 3. aws-auth: map both roles to their Kubernetes groups (additive, idempotent) ---
echo
echo "==> Mapping IAM roles into kube-system/aws-auth"
for pair in "$PLAN_ROLE_ARN:ensemble-observability-planners" "$APPLY_ROLE_ARN:ensemble-observability-appliers"; do
  role_arn="${pair%%:ensemble-observability-*}"
  group="ensemble-observability-${pair##*:ensemble-observability-}"
  current="$(kubectl -n kube-system get configmap aws-auth -o jsonpath='{.data.mapRoles}')"
  if echo "$current" | grep -qF "$role_arn"; then
    echo "    $role_arn already mapped, skipping"
    continue
  fi
  username="$(basename "$role_arn")"
  updated="$(printf '%s\n- rolearn: %s\n  username: %s\n  groups:\n  - %s\n' "$current" "$role_arn" "$username" "$group")"
  kubectl -n kube-system patch configmap aws-auth --type merge \
    -p "{\"data\":{\"mapRoles\":$(printf '%s' "$updated" | jq -Rs .)}}"
  echo "    mapped $role_arn -> group $group"
done

# --- 4. observability-apply GitHub environment: required reviewer (you), main branch only ---
echo
echo "==> Configuring the observability-apply GitHub environment on $GH_REPO"
GH_USER_ID="$(gh api user --jq .id)"
gh api -X PUT "repos/$GH_REPO/environments/observability-apply" --input - >/dev/null <<EOF
{
  "reviewers": [{"type": "User", "id": $GH_USER_ID}],
  "deployment_branch_policy": {"protected_branches": false, "custom_branch_policies": true}
}
EOF
gh api -X POST "repos/$GH_REPO/environments/observability-apply/deployment-branch-policies" \
  -f name=main >/dev/null 2>&1 || true # 409 when the main policy already exists

# --- 5. Repository secrets the workflow reads ---
echo "==> Setting repository secrets"
gh secret set OBSERVABILITY_PLAN_ROLE_ARN --body "$PLAN_ROLE_ARN"
gh secret set OBSERVABILITY_APPLY_ROLE_ARN --body "$APPLY_ROLE_ARN"

gh secret list | grep -q "^EKS_CLUSTER_NAME" \
  || echo "WARNING: repository secret EKS_CLUSTER_NAME is not set; the workflow needs it (same one Deploy already uses)."

echo
echo "Done. Next: trigger the 'Observability Apply' workflow from the Actions tab (or via API)"
echo "with apply unchecked, review the kubectl diff, then re-run with apply checked and approve"
echo "the observability-apply environment gate."
