#!/usr/bin/env bash
# Loads the demo product catalog into the DynamoDB `ensemble-products` table.
# Regenerates the seed from data.sql, then batch-writes it. Idempotent: PutRequest
# overwrites existing items by id, so re-running simply refreshes the catalog.
#
# Requires: node, aws CLI with credentials for account 629513454417 (us-east-1).
# Usage: scripts/dynamodb/seed-products.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SEED="$ROOT/infra/seed/products-seed.json"
REGION="${AWS_REGION:-us-east-1}"

node "$ROOT/scripts/dynamodb/generate-products-seed.mjs"

COUNT="$(node -e "console.log(require('$SEED').length)")"
echo "Loading $COUNT batch(es) into ensemble-products ($REGION)…"

for ((i = 0; i < COUNT; i++)); do
  TMP="$(mktemp)"
  node -e "require('fs').writeFileSync('$TMP', JSON.stringify(require('$SEED')[$i]))"
  # DynamoDB can return UnprocessedItems under throttling; retry until the map is empty.
  attempt=0
  while :; do
    UNPROCESSED="$(aws dynamodb batch-write-item --region "$REGION" \
      --request-items "file://$TMP" \
      --query 'length(UnprocessedItems)' --output text)"
    [ "$UNPROCESSED" = "0" ] && break
    attempt=$((attempt + 1))
    [ "$attempt" -ge 5 ] && { echo "  batch $((i + 1)) still has unprocessed items after 5 tries" >&2; exit 1; }
    sleep 1
  done
  rm -f "$TMP"
  echo "  batch $((i + 1))/$COUNT written"
done

echo "Done. Verify: aws dynamodb scan --table-name ensemble-products --select COUNT --region $REGION"
