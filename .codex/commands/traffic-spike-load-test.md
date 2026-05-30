# /traffic-spike-load-test

Run the Ensemble-Grafana traffic spike load-test workflow.

## Intent

Use this command when the user asks to run the traffic spike benchmark, validate traffic spike performance, or produce the standard post-load-test report.

## Workflow

1. Follow `skills/observability/SKILLS.md`, especially the `k6 Load Testing` section.
2. Confirm `API_TEST_KEY` is available from the local `.env` file or the current shell environment. Do not print the value.
3. Run the traffic spike benchmark:

```sh
set -a
source .env
set +a
STOREFRONT_BASE_URL="${STOREFRONT_BASE_URL:-https://ensemble-grafana.com}" \
API_BASE_URL="${API_BASE_URL:-https://api.ensemble-grafana.com}" \
API_TEST_KEY="$API_TEST_KEY" \
k6 run load-tests/grafana-cloud-traffic-spikes.js
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

6. Summarize the run result, threshold failures, report path, and any Grafana Cloud run URL if available.

## Notes

- The default traffic spike baseline is controlled by `BASE_SPIKE_USERS` in `load-tests/grafana-cloud-traffic-spikes.js`.
- The current default spike sequence is `100`, `150`, and `225` VUs.
- Use `BASE_SPIKE_USERS=<value>` to override the first spike for one run.
- Keep generated raw k6 JSON ignored; commit only intentional report artifacts when the user asks to persist them.
