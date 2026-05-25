#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$root_dir"

failures=0
secret_pattern='AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|glc_[A-Za-z0-9_-]{20,}|glsa_[A-Za-z0-9_-]{20,}|GOCSPX-[A-Za-z0-9_-]+'

check_absent() {
  local pattern="$1"
  local description="$2"
  local hits=""

  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if [[ -n "$(git ls-files)" ]]; then
      hits="$(git ls-files -z | xargs -0 grep -nE "$pattern" 2>/dev/null || true)"
    fi
  else
    hits="$(find . \
      -path './frontend/node_modules' -prune -o \
      -path './infra/terraform/.terraform' -prune -o \
      -path './infra/terraform/stacks/*/.terraform' -prune -o \
      -path './.m2' -prune -o \
      -path './services/*/target' -prune -o \
      -path './infra/k8s/observability-secrets.yaml' -prune -o \
      -path './infra/k8s/observability-secrets.example.yaml' -prune -o \
      -path './infra/k8s/secrets.yaml' -prune -o \
      -type f -print0 | xargs -0 grep -nE "$pattern" 2>/dev/null || true)"
  fi

  if [[ -n "$hits" ]]; then
    echo "FAIL: $description"
    printf '%s\n' "$hits"
    failures=$((failures + 1))
  else
    echo "PASS: $description"
  fi
}

check_present() {
  local pattern="$1"
  local file="$2"
  local description="$3"
  if grep -qE "$pattern" "$file"; then
    echo "PASS: $description"
  else
    echo "FAIL: $description"
    failures=$((failures + 1))
  fi
}

check_absent "$secret_pattern" "no obvious access keys, private keys, Grafana tokens, or Google OAuth secrets are committed"
check_present 'pod-security.kubernetes.io/enforce: restricted' infra/k8s/namespace.yaml "application namespace enforces restricted pod security"
check_present 'allowPrivilegeEscalation: false' infra/k8s/services.yaml "application pods deny privilege escalation"
check_present 'readOnlyRootFilesystem: true' infra/k8s/services.yaml "application pods use read-only root filesystems"
check_present 'AWSManagedRulesSQLiRuleSet' infra/terraform/main.tf "CloudFront WAF includes SQLi managed rules"
check_present 'point_in_time_recovery' infra/terraform/main.tf "DynamoDB point-in-time recovery is configured"
check_present 'strict_transport_security' infra/terraform/main.tf "CloudFront HSTS response header is configured"
check_present 'spring-boot-starter-security' services/cart-service/pom.xml "cart service includes Spring Security"
check_present 'spring-boot-starter-security' services/account-service/pom.xml "account service includes Spring Security"
check_present 'spring-boot-starter-security' services/inventory-service/pom.xml "inventory service includes Spring Security"
check_present 'GRAFANA_CLOUD_API_KEY: replace-me' infra/k8s/observability-secrets.example.template.yaml "observability secrets template uses placeholders"

if [[ "$failures" -gt 0 ]]; then
  echo "$failures security check(s) failed"
  exit 1
fi

echo "Security predeploy checks passed"
