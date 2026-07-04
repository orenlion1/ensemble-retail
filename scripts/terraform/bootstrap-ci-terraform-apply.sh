#!/usr/bin/env bash

# One-time local bootstrap for the guarded "Terraform Apply" GitHub Actions workflow
# (.github/workflows/terraform-apply.yml). Run from anywhere inside the repo with real AWS
# credentials and an authenticated gh CLI. Idempotent: safe to re-run after a partial failure.
#
# What it does, in order:
#   1. Applies infra/terraform/stacks/ci-terraform-apply (state bucket, lock table, and the two
#      OIDC IAM roles the workflow assumes). This stack keeps local state on purpose — it is the
#      bootstrap root of trust and cannot depend on the backend it creates.
#   2. Migrates stacks/cluster and stacks/cloudwatch-integration local state into the S3 backend.
#   3. Imports the pre-existing EKS control-plane log group into the cluster state so the
#      retention change applies to it instead of colliding with it.
#   4. Creates the "terraform-apply" GitHub environment with the current gh user as required
#      reviewer, restricted to the main branch.
#   5. Sets the TERRAFORM_PLAN_ROLE_ARN / TERRAFORM_APPLY_ROLE_ARN secrets and the
#      TF_BACKEND_* / CLUSTER_*_SUBNET_IDS repository variables the workflow reads.

set -euo pipefail

EXPECTED_AWS_ACCOUNT_ID="${EXPECTED_AWS_ACCOUNT_ID:-629513454417}"
export AWS_REGION="${AWS_REGION:-us-east-1}"
export AWS_DEFAULT_REGION="$AWS_REGION"

for tool in aws terraform gh jq git; do
  command -v "$tool" >/dev/null 2>&1 || { echo "Refusing to run: '$tool' is required." >&2; exit 1; }
done

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"
STACKS_DIR="infra/terraform/stacks"

for stack in cluster cloudwatch-integration; do
  grep -q 'backend "s3"' "$STACKS_DIR/$stack/versions.tf" || {
    echo "Refusing to run: $STACKS_DIR/$stack/versions.tf has no s3 backend block — run 'git pull origin main' first." >&2
    exit 1
  }
done

ACTUAL_AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
if [[ "$ACTUAL_AWS_ACCOUNT_ID" != "$EXPECTED_AWS_ACCOUNT_ID" ]]; then
  echo "Refusing to run: caller account '$ACTUAL_AWS_ACCOUNT_ID' does not match expected '$EXPECTED_AWS_ACCOUNT_ID' (override with EXPECTED_AWS_ACCOUNT_ID)." >&2
  exit 1
fi

GH_REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"

echo "AWS account:    $ACTUAL_AWS_ACCOUNT_ID ($AWS_REGION)"
echo "GitHub repo:    $GH_REPO"
echo "This will create IAM roles, an S3 state bucket, and a DynamoDB lock table, migrate"
echo "Terraform state for stacks/cluster and stacks/cloudwatch-integration into S3, and"
echo "configure the terraform-apply GitHub environment, secrets, and variables."
read -r -p "Proceed? (yes/no) " answer
[[ "$answer" == "yes" ]] || { echo "Aborted."; exit 1; }

# --- 1. Bootstrap stack: roles + state bucket + lock table (local state, interactive approve) ---
echo
echo "==> Applying $STACKS_DIR/ci-terraform-apply (review the plan; Terraform will prompt)"
terraform -chdir="$STACKS_DIR/ci-terraform-apply" init -input=false
terraform -chdir="$STACKS_DIR/ci-terraform-apply" apply

PLAN_ROLE_ARN="$(terraform -chdir="$STACKS_DIR/ci-terraform-apply" output -raw terraform_plan_role_arn)"
APPLY_ROLE_ARN="$(terraform -chdir="$STACKS_DIR/ci-terraform-apply" output -raw terraform_apply_role_arn)"
STATE_BUCKET="$(terraform -chdir="$STACKS_DIR/ci-terraform-apply" output -raw state_bucket)"
LOCK_TABLE="$(terraform -chdir="$STACKS_DIR/ci-terraform-apply" output -raw lock_table)"

# --- 2. Migrate cluster + cloudwatch-integration state into the S3 backend ---
for stack in cluster cloudwatch-integration; do
  stack_dir="$STACKS_DIR/$stack"
  echo
  if [[ -f "$stack_dir/.terraform/terraform.tfstate" ]] && grep -q '"type": "s3"' "$stack_dir/.terraform/terraform.tfstate"; then
    echo "==> $stack: already on the s3 backend, skipping migration"
    continue
  fi
  echo "==> $stack: migrating state to s3://$STATE_BUCKET/stacks/$stack/terraform.tfstate"
  terraform -chdir="$stack_dir" init -input=false -force-copy \
    -backend-config="bucket=$STATE_BUCKET" \
    -backend-config="key=stacks/$stack/terraform.tfstate" \
    -backend-config="region=$AWS_REGION" \
    -backend-config="dynamodb_table=$LOCK_TABLE"
  # Leave no live-looking local state behind: a later -force-copy re-run must never clobber the
  # now-authoritative remote state with this stale copy.
  if [[ -f "$stack_dir/terraform.tfstate" ]]; then
    mv "$stack_dir/terraform.tfstate" "$stack_dir/terraform.tfstate.migrated-backup"
    echo "    local state kept as terraform.tfstate.migrated-backup"
  fi
done

# --- 3. Import the EKS-auto-created control-plane log group into the cluster state ---
echo
export TF_VAR_private_subnet_ids TF_VAR_public_subnet_ids
TF_VAR_private_subnet_ids="$(terraform -chdir="$STACKS_DIR/network" output -json private_subnet_ids | jq -c .)"
TF_VAR_public_subnet_ids="$(terraform -chdir="$STACKS_DIR/network" output -json public_subnet_ids | jq -c .)"
if terraform -chdir="$STACKS_DIR/cluster" state list | grep -q '^aws_cloudwatch_log_group\.eks_cluster$'; then
  echo "==> cluster: log group already in state, skipping import"
else
  echo "==> cluster: importing /aws/eks/ensemble-grafana/cluster log group"
  terraform -chdir="$STACKS_DIR/cluster" import -input=false \
    aws_cloudwatch_log_group.eks_cluster /aws/eks/ensemble-grafana/cluster
fi

# --- 4. terraform-apply GitHub environment: required reviewer (you), main branch only ---
echo
echo "==> Configuring the terraform-apply GitHub environment on $GH_REPO"
GH_USER_ID="$(gh api user --jq .id)"
gh api -X PUT "repos/$GH_REPO/environments/terraform-apply" --input - >/dev/null <<EOF
{
  "reviewers": [{"type": "User", "id": $GH_USER_ID}],
  "deployment_branch_policy": {"protected_branches": false, "custom_branch_policies": true}
}
EOF
gh api -X POST "repos/$GH_REPO/environments/terraform-apply/deployment-branch-policies" \
  -f name=main >/dev/null 2>&1 || true # 409 when the main policy already exists

# --- 5. Repository secrets and variables the workflow reads ---
echo "==> Setting repository secrets and variables"
gh secret set TERRAFORM_PLAN_ROLE_ARN --body "$PLAN_ROLE_ARN"
gh secret set TERRAFORM_APPLY_ROLE_ARN --body "$APPLY_ROLE_ARN"
gh variable set TF_BACKEND_BUCKET --body "$STATE_BUCKET"
gh variable set TF_BACKEND_DYNAMODB_TABLE --body "$LOCK_TABLE"
gh variable set CLUSTER_PRIVATE_SUBNET_IDS --body "$TF_VAR_private_subnet_ids"
gh variable set CLUSTER_PUBLIC_SUBNET_IDS --body "$TF_VAR_public_subnet_ids"

for secret in GRAFANA_CLOUD_PROVIDER_ACCESS_TOKEN GRAFANA_CLOUD_EXTERNAL_ID; do
  gh secret list | grep -q "^$secret" \
    || echo "WARNING: repository secret $secret is not set; the cloudwatch-integration stack needs it."
done

echo
echo "Done. Next: trigger the 'Terraform Apply' workflow from the Actions tab (or via API)"
echo "with stack=cluster and apply unchecked, review the plan, then re-run with apply checked"
echo "and approve the terraform-apply environment gate. Repeat for stack=cloudwatch-integration."
