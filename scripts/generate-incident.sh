#!/usr/bin/env sh
set -eu

: "${GRAFANA_IRM_URL:=https://incident-prod-us-east-3.grafana.net/incident}"
: "${GRAFANA_IRM_TOKEN:?Set GRAFANA_IRM_TOKEN}"

REGION="${REGION:-US}"
FEATURE="${FEATURE:-shopping-cart-checkout}"
SERVICE="${SERVICE:-cart}"
ROOT_CAUSE="${ROOT_CAUSE:-Manual-Error}"
PRODUCT_CATEGORY="${PRODUCT_CATEGORY:-mens_hiking}"
CLIENT_IMPACT="${CLIENT_IMPACT:-multiple-clients}"
SEVERITY="${SEVERITY:-SEV3}"

curl -sS -X POST "$GRAFANA_IRM_URL/api/v1/incidents" \
  -H "Authorization: Bearer $GRAFANA_IRM_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Ensemble-Grafana test checkout degradation\",
    \"severity\": \"$SEVERITY\",
    \"labels\": {
      \"region\": \"$REGION\",
      \"feature\": \"$FEATURE\",
      \"service\": \"$SERVICE\",
      \"root_cause\": \"$ROOT_CAUSE\",
      \"product_category\": \"$PRODUCT_CATEGORY\",
      \"client_impact\": \"$CLIENT_IMPACT\"
    }
  }"
