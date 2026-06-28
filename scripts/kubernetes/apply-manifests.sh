#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
manifest_dir="$root_dir/infra/k8s"
obs_ns="ensemble-observability"

kubectl apply -f "$manifest_dir/namespace.yaml"

# App secrets: validate the template only (the real secret is applied out of band).
kubectl apply -f "$manifest_dir/secrets.example.yaml" --dry-run=client

# Observability secrets: apply the REAL file when present (gitignored; holds the live
# Grafana + Honeycomb keys). Track whether grafana-cloud-secrets actually changed so the
# collectors are only bounced when needed (envFrom secret changes don't hot-reload pods).
obs_secret_changed=false
if [ -f "$manifest_dir/observability-secrets.yaml" ]; then
  out="$(kubectl apply -f "$manifest_dir/observability-secrets.yaml")"; echo "$out"
  echo "$out" | grep -qE 'secret/grafana-cloud-secrets (configured|created)' && obs_secret_changed=true
else
  echo "WARN: $manifest_dir/observability-secrets.yaml absent — dry-running the template" \
       "only; in-cluster Grafana/Honeycomb keys will NOT be updated." >&2
  kubectl apply -f "$manifest_dir/observability-secrets.example.template.yaml" --dry-run=client
fi

# Alloy / Beyla / Pyroscope (includes the alloy-config + pyroscope-alloy-config ConfigMaps).
alloy_out="$(kubectl apply -f "$manifest_dir/alloy-beyla.yaml")"; echo "$alloy_out"
alloy_cfg_changed=false; pyro_cfg_changed=false
echo "$alloy_out" | grep -qE 'configmap/alloy-config (configured|created)' && alloy_cfg_changed=true
echo "$alloy_out" | grep -qE 'configmap/pyroscope-alloy-config (configured|created)' && pyro_cfg_changed=true

kubectl apply -f "$manifest_dir/services.yaml"
kubectl apply -f "$manifest_dir/policies/network-policies.yaml"
kubectl apply -f "$manifest_dir/ingress.yaml"

# Roll the collectors only as needed by config/secret changes. A ConfigMap edit or an
# envFrom secret change does not reach a running pod until it restarts.
if $alloy_cfg_changed || $obs_secret_changed; then
  echo "==> alloy config/secret changed -> rollout restart deployment/alloy"
  kubectl -n "$obs_ns" rollout restart deployment/alloy
  kubectl -n "$obs_ns" rollout status deployment/alloy --timeout=120s
else
  echo "==> alloy config/secret unchanged -> no restart"
fi
if $pyro_cfg_changed || $obs_secret_changed; then
  echo "==> pyroscope-alloy config/secret changed -> rollout restart daemonset/pyroscope-alloy"
  kubectl -n "$obs_ns" rollout restart daemonset/pyroscope-alloy
fi
