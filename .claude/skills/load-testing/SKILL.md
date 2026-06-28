---
name: load-testing
description: Run k6 load, spike, and browser-action tests for Ensemble-Retail against Grafana Cloud k6, validate Faro user-action telemetry, and refresh load-test comparison reports and dashboards. Use when running a load test, spike benchmark, regional/persona test, or k6 cloud run; setting k6 env (API_TEST_KEY, base URLs, k6 cloud login); or generating/updating load-test reports and the Load Run History dashboard panel.
---

# k6 Load Testing (Ensemble-Retail)

Pulled from the `ensemble-observability-gcx` Codex skill's k6 section. Run load tests in
Grafana Cloud k6 by default; use local `k6 run` only for script debugging.

## Scripts to provide

- API load test for catalog, cart, account flows.
- Regional Cloud k6 test with multiple personas and region switching.
- Spike benchmark with multiple traffic spikes.
- Browser-action synthetic check that exercises all `data-faro-user-action-name` controls.
- Low-cardinality group names and request `name` tags. Use static group names and route
  templates such as `PUT /api/cart/carts/:shopperId` instead of embedding user IDs, product
  IDs, or cart IDs in group labels.
- Grafana Tempo HTTP instrumentation with W3C propagation for HTTP tests, so Grafana Cloud
  k6 can correlate requests with backend traces when service traces flow to Grafana Cloud Traces.

## Recommended spike profile

- Spike 1 at baseline peak; Spike 2 at 2x; Spike 3 at 2x again — with recovery windows between.
- Keep browser-action load sustained with multiple browser VUs when Faro user-action volume is
  part of the goal. A single shared browser iteration only validates coverage. Keep browser VU
  counts lower than protocol/API VUs — each browser VU launches Chromium and fails first with
  page navigation timeouts under spike pressure.
- Browser-action scripts should wait for a stable app-shell selector instead of global network
  idle when the app emits background telemetry or loads remote images.
- For high protocol/API volume, prefer a `constant-arrival-rate` scenario with low-cardinality
  request names. The Ensemble traffic-spike profile runs a steady `API_REQUEST_RPS=5`
  scenario (VU pool `5/20`). Weight inventory and account lighter than cart; use `INVENTORY_REQUEST_INTERVAL`
  and `ACCOUNT_WRITE_INTERVAL` to avoid every-iteration catalog reads / account writes unless
  that saturation is the goal.
- Ramp browser VUs up rather than starting all Chromium sessions at once.
- When user-action throughput is the goal, add tagged per-action counters and thresholds for
  every expected action family (default target: ≥0.18 user-action events/sec per family).
- For zero-failure custom counters with thresholds like `count==0`, emit an explicit
  `Counter.add(0, tags)` on success paths, or Grafana Cloud k6 may receive no series for a
  perfect run (ambiguous/falsely-failed threshold).

## Required k6 environment

- Native k6 token for `k6 cloud login`.
- `API_TEST_KEY` as a Grafana Cloud k6 env var/secret for protected cart/account writes.
- `STOREFRONT_BASE_URL` and `API_BASE_URL` when static assets and APIs use separate origins.
- For end-to-end edge tests, set `API_BASE_URL` to the storefront domain so `/api/*` traverses
  CloudFront; use the API origin domain only when intentionally bypassing CloudFront.
- Default to `k6 cloud run`; use local `k6 run` only for debugging or when Cloud is unavailable.
- Inject secrets via a temporary local `.env` for Cloud runs needing `API_TEST_KEY`:
  `set -a && source .env && set +a && k6 cloud run -e API_TEST_KEY="$API_TEST_KEY" ...`
  (keep `.env` gitignored). On `API_TEST_KEY is required`, prompt the user to set it and rerun.
- If `gcx k6` token exchange fails, call the k6 Cloud REST API directly with the native token:
  `Authorization: Bearer $K6_CLOUD_TOKEN`, `X-Stack-Id: <stack id>`,
  `/cloud/v6/load_tests/{id}/test_runs`. Normalize into the same
  `reports/load-tests/k6-summary-*.json` / `k6-runs-*.json` shape the report expects.

## After each run

Validate Faro user-action telemetry with `gcx logs query`; confirm expected
`faro.user.action` events for browser flows. Generate the user-action report in
`reports/frontend-user-actions/` via `node scripts/report-faro-user-actions.mjs`, using the
standard six-hour execution query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

Update the load-test comparison artifacts after every run (passed, failed, or error, whenever
Grafana/k6 returns usable run metadata):

```bash
node scripts/report-load-tests.mjs
```

This produces `reports/load-tests/load-test-comparison.md`, the comparison CSVs, the SVG charts
(by date, duration, VUH cost, HTTP failure rate, check pass rate, HTTP p95, user-action/cart
totals), and `docs/graphviz/load-run-table.{dot,svg,png}`. Keep raw `reports/load-tests/k6-*.json`
pulls gitignored — Grafana Cloud run payloads can include runtime token fields.

After every traffic-spike test, push the refreshed `docs/graphviz/load-run-table.dot` into the
`User Action Traffic: Real Users vs k6` dashboard, `Load Run History` tab, `panel-17`, following
`skills/graphviz/dashboard-inventory/SKILL.md`: fetch the live dashboard first, update only
`panel-17`, publish with `gcx dashboards update or46lql`, then fetch it back into
`observability/grafana/dashboards/user-action-traffic-real-users-vs-k6.json`.

Document the Grafana Cloud k6 run URLs after each cloud execution.
