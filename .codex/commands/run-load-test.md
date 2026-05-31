# /run-load-test

Run the Ensemble-Grafana traffic spike load-test workflow.

## Intent

Use this command when the user asks to run the traffic spike benchmark, validate traffic spike performance, or produce the standard post-load-test report.

## Workflow

1. Follow `skills/observability/SKILLS.md`, especially the `k6 Load Testing` section.
2. Confirm `API_TEST_KEY` is available from the local `.env` file or the current shell environment. Do not print the value.
3. Run the traffic spike benchmark in Grafana Cloud k6. Use `-e` flags for values that must reach remote Grafana Cloud k6 workers:

```sh
set -a
source .env
set +a
K6_CLOUD_TOKEN="$K6_CLOUD_TOKEN" k6 cloud run \
  -e API_TEST_KEY="$API_TEST_KEY" \
  -e STOREFRONT_BASE_URL="${STOREFRONT_BASE_URL:-https://ensemble-grafana.com}" \
  -e API_BASE_URL="${API_BASE_URL:-https://ensemble-grafana.com}" \
  load-tests/grafana-cloud-traffic-spikes.js
```

4. After the run concludes, generate the standard comparison report:

```sh
node scripts/report-load-tests.mjs
```

5. If the run exercised browser/Faro user actions, refresh the Grafana Cloud Faro action totals and rerun the comparison report:

```sh
node scripts/report-faro-user-actions.mjs
node scripts/report-load-tests.mjs
```

6. Summarize the run result, threshold failures, report path, and the Grafana Cloud k6 run URL.

## Notes

- The default traffic spike baseline is controlled by `BASE_SPIKE_USERS` in `load-tests/grafana-cloud-traffic-spikes.js`.
- The current default spike sequence is `100`, `200`, and `400` VUs.
- Use `BASE_SPIKE_USERS=<value>` to override the first spike for one run.
- Use `SPIKE_MULTIPLIER=<value>` to override the spike growth factor for one run.
- The default `API_BASE_URL` is `https://ensemble-grafana.com` so `/api/*` traffic exercises CloudFront API routing. Override it with `https://api.ensemble-grafana.com` only when testing the ALB/API origin directly.
- The default steady API scenario uses `API_REQUEST_RPS=40`, `API_REQUEST_PRE_ALLOCATED_VUS=20`, and `API_REQUEST_MAX_VUS=65` for the requested 40 requests/second protocol load.
- The default steady API scenario weights inventory and account lighter than cart, spike shopper journeys use `INVENTORY_REQUEST_INTERVAL=3` so inventory-service does not receive catalog reads on every iteration, and they use `ACCOUNT_WRITE_INTERVAL=3` so account-service does not receive account writes on every account or checkout iteration.
- The default browser-action scenario uses `BROWSER_ACTION_VUS=5`, `BROWSER_ACTION_RAMP_UP=2m`, `BROWSER_ACTION_HOLD=6m`, `BROWSER_ACTION_RAMP_DOWN=2m`, and `USER_ACTION_TARGET_RPS=0.2` so Faro actions are still validated without making Chromium capacity the bottleneck.
- The default combined benchmark peaks at 500 VUs. Increase the project quota or lower `BASE_SPIKE_USERS`, `REGIONAL_SHOPPER_VUS`, `API_REQUEST_MAX_VUS`, or `BROWSER_ACTION_VUS` for quota-constrained validation runs.
- Use local `k6 run` only when explicitly debugging a script or when Grafana Cloud k6 is unavailable.
- Keep generated raw k6 JSON ignored; commit only intentional report artifacts when the user asks to persist them.
