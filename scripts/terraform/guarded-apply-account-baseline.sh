#!/usr/bin/env bash

set -euo pipefail

STACK_DIR="infra/terraform/stacks/account-baseline"
EXPECTED_AWS_ACCOUNT_ID="629513454417"
EXPECTED_AWS_REGION="us-east-1"

if [[ "${CONFIRM_ACCOUNT_BASELINE_APPLY:-}" != "yes" ]]; then
  echo "Refusing apply. Set CONFIRM_ACCOUNT_BASELINE_APPLY=yes after approved plan review."
  exit 1
fi

if [[ "${ALLOW_AUTO_APPROVE:-}" == "true" ]]; then
  echo "Refusing apply. Auto-approve is disabled for account-baseline."
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "Refusing apply. aws CLI is required for account verification."
  exit 1
fi

ACTUAL_AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
if [[ "$ACTUAL_AWS_ACCOUNT_ID" != "$EXPECTED_AWS_ACCOUNT_ID" ]]; then
  echo "Refusing apply. Caller account '$ACTUAL_AWS_ACCOUNT_ID' does not match required account '$EXPECTED_AWS_ACCOUNT_ID'."
  exit 1
fi

if [[ "${AWS_REGION:-$EXPECTED_AWS_REGION}" != "$EXPECTED_AWS_REGION" ]]; then
  echo "Refusing apply. Set AWS_REGION to '$EXPECTED_AWS_REGION' for this account-baseline stack."
  exit 1
fi

cd "$STACK_DIR"
terraform init
terraform plan -out=tfplan
terraform apply tfplan
