#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${GRAFANA_SERVER:?Set GRAFANA_SERVER to your stack URL, for example https://your-stack.grafana.net}"
: "${GRAFANA_STACK_ID:?Set GRAFANA_STACK_ID, for example 1665320}"
: "${GRAFANA_CLOUD_STACK:?Set GRAFANA_CLOUD_STACK to your stack slug}"
: "${GRAFANA_CLOUD_TOKEN:?Set GRAFANA_CLOUD_TOKEN to a Grafana Cloud access policy token}"
: "${GRAFANA_PROVIDER_SYNTH_SM_URL:?Set GRAFANA_PROVIDER_SYNTH_SM_URL to the Synthetic Monitoring backend URL}"
: "${GRAFANA_PROVIDER_SYNTH_SM_TOKEN:?Set GRAFANA_PROVIDER_SYNTH_SM_TOKEN to a Synthetic Monitoring access token}"
: "${GRAFANA_SM_METRICS_DATASOURCE_UID:=orenlion-prom}"

gcx config set grafana.server "$GRAFANA_SERVER"
gcx config set grafana.token "$GRAFANA_CLOUD_TOKEN"
gcx config set contexts.default.default-prometheus-datasource "$GRAFANA_SM_METRICS_DATASOURCE_UID"
gcx config set contexts.default.providers.synth.sm-url "$GRAFANA_PROVIDER_SYNTH_SM_URL"
gcx config set contexts.default.providers.synth.sm-token "$GRAFANA_PROVIDER_SYNTH_SM_TOKEN"
gcx config set contexts.default.providers.synth.sm-metrics-datasource-uid "$GRAFANA_SM_METRICS_DATASOURCE_UID"

if ! gcx config check; then
  echo "gcx config check could not validate the Grafana stack API token; continuing with explicit Synthetic Monitoring datasource UID: $GRAFANA_SM_METRICS_DATASOURCE_UID" >&2
fi

gcx synthetic-monitoring probes create \
  --name ensemble-grafana-us \
  --region us \
  --labels environment=production,site=ensemble-grafana,region=us \
  --latitude 39.8283 \
  --longitude -98.5795 || true

gcx synthetic-monitoring probes create \
  --name ensemble-grafana-canada \
  --region ca \
  --labels environment=production,site=ensemble-grafana,region=canada \
  --latitude 56.1304 \
  --longitude -106.3468 || true

gcx synthetic-monitoring probes create \
  --name ensemble-grafana-uk \
  --region uk \
  --labels environment=production,site=ensemble-grafana,region=uk \
  --latitude 55.3781 \
  --longitude -3.4360 || true

gcx synthetic-monitoring probes list --limit 0

for check in \
  check-site-uptime-tls.yaml \
  check-api-response-time.yaml \
  check-ping-reachability.yaml \
  check-dns-resolution.yaml \
  check-tcp-tls-connectivity.yaml
do
  check_name="$(awk '/^  name:/ {print $2; exit}' "$check")"
  gcx synthetic-monitoring checks create -f "$check" --validate-targets || \
    gcx synthetic-monitoring checks update "$check_name" -f "$check" --validate-targets
done

gcx synthetic-monitoring checks list --job 'ensemble-grafana-*'
gcx synthetic-monitoring checks status --job 'ensemble-grafana-*' --datasource-uid "$GRAFANA_SM_METRICS_DATASOURCE_UID" || true
