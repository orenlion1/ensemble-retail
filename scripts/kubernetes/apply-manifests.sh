#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
manifest_dir="$root_dir/infra/k8s"

kubectl apply -f "$manifest_dir/namespace.yaml"
kubectl apply -f "$manifest_dir/secrets.example.yaml" --dry-run=client
kubectl apply -f "$manifest_dir/observability-secrets.example.template.yaml" --dry-run=client
kubectl apply -f "$manifest_dir/alloy-beyla.yaml"
kubectl apply -f "$manifest_dir/services.yaml"
kubectl apply -f "$manifest_dir/policies/network-policies.yaml"
kubectl apply -f "$manifest_dir/ingress.yaml"
