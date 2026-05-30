# k6 Load Test Comparison

Generated: 2026-05-30T15:00:45.535Z

Source summary: `reports/load-tests/k6-summary-20260530T131841Z.json`

Source run history: `reports/load-tests/k6-runs-20260530-091706.json`

## Latest Runs

| Test ID | Test | Latest Run | Date | Result | Duration | HTTP Requests | HTTP Failure Rate | HTTP p95 | Check Pass Rate |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|
| 1228494 | API flow load test | n/a | n/a | n/a | n/a | n/a | n/a | n/a | No runs found |
| 1228490 | 20-user regional load test | [7634314](https://orenlion.grafana.net/a/k6-app/runs/7634314) | 05/28/2026, 12:00 | ❌ | 13.9m | 503257 | 66.50% | 56.8 ms | 25.21% |
| 1228496 | Traffic spike benchmark | [7627516](https://orenlion.grafana.net/a/k6-app/runs/7627516) | 05/27/2026, 13:05 | ❌ | 11.8m | 432009 | 66.49% | 59.6 ms | 33.51% |
| 1228497 | Browser action synthetic check | [7642853](https://orenlion.grafana.net/a/k6-app/runs/7642853) | 05/29/2026, 17:21 | ✅ | 3.8m | n/a | n/a | n/a | 100.00% |

## Visual Comparison

### Result By Date

![Load test result by date](comparison/load-test-results-by-date.svg)

### Duration By Date

![Run duration by date](comparison/load-test-duration-by-date.svg)

### VUH Cost By Date

![VUH cost by date](comparison/load-test-vuh-by-date.svg)

### Latest HTTP Failure Rate

![Latest HTTP failure rate](comparison/latest-http-failure-rate.svg)

### Latest Check Pass Rate

![Latest check pass rate](comparison/latest-check-pass-rate.svg)

### Latest HTTP p95

![Latest HTTP p95](comparison/latest-http-p95.svg)

### Latest User Action And Cart Totals

![Latest user action and cart totals](comparison/latest-user-action-totals.svg)

## Result Summary

| Test | Runs | Passed | Failed | Errors | Pass Rate |
|---|---:|---:|---:|---:|---:|
| 20-user regional load test | 5 | 4 | 1 | 0 | 80.00% |
| Browser action synthetic check | 2 | 2 | 0 | 0 | 100.00% |
| Traffic spike benchmark | 5 | 2 | 2 | 1 | 40.00% |

## Request And User Action Totals

These totals come from local k6 summary files named `reports/load-tests/k6-local-summary-*.json`. Cloud run history still provides total HTTP requests for latest runs, but per-action counters such as shopping cart add/remove require these local summaries or equivalent exported metric data.

| Date | Generated | Test | HTTP Requests | HTTP Failures | HTTP Failure Rate | User Actions | Cart Adds Total | Add Item | Add Detail | Add Sale | Remove Item | Checkout | API Cart Updates | Checkout Attempts | Region Changes |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2026-05-30 | 05/30/2026, 10:58 | Browser action synthetic check | 135 | 14 | 10.37% | 31 | 4 | 1 | 2 | 1 | 1 | 1 | n/a | n/a | n/a |

## Run History

| Date | Started | Test | Run | Result | Duration | Total VUH | Protocol VUH | Browser VUH |
|---|---|---|---|---:|---:|---:|---:|---:|
| 2026-05-29 | 05/29/2026, 17:21 | Browser action synthetic check | [7642853](https://orenlion.grafana.net/a/k6-app/runs/7642853) | ✅ | 0.3m | 1.00 | 0.00 | 1.00 |
| 2026-05-28 | 05/28/2026, 12:00 | 20-user regional load test | [7634314](https://orenlion.grafana.net/a/k6-app/runs/7634314) | ❌ | 10.0m | 5.01 | 3.34 | 1.67 |
| 2026-05-28 | 05/28/2026, 11:35 | 20-user regional load test | [7634188](https://orenlion.grafana.net/a/k6-app/runs/7634188) | ✅ | 10.0m | 5.01 | 3.34 | 1.67 |
| 2026-05-28 | 05/28/2026, 11:05 | 20-user regional load test | [7634040](https://orenlion.grafana.net/a/k6-app/runs/7634040) | ✅ | 10.0m | 5.01 | 3.34 | 1.67 |
| 2026-05-27 | 05/27/2026, 13:05 | Traffic spike benchmark | [7627516](https://orenlion.grafana.net/a/k6-app/runs/7627516) | ❌ | 8.5m | 6.38 | 6.38 | 0.00 |
| 2026-05-27 | 05/27/2026, 12:41 | Traffic spike benchmark | [7627390](https://orenlion.grafana.net/a/k6-app/runs/7627390) | ❌ | 8.5m | 6.38 | 6.38 | 0.00 |
| 2026-05-27 | 05/27/2026, 12:06 | Traffic spike benchmark | [7627249](https://orenlion.grafana.net/a/k6-app/runs/7627249) | ✅ | 8.5m | 6.38 | 6.38 | 0.00 |
| 2026-05-27 | 05/27/2026, 11:58 | Browser action synthetic check | [7627200](https://orenlion.grafana.net/a/k6-app/runs/7627200) | ✅ | 0.3m | 1.00 | 0.00 | 1.00 |
| 2026-05-27 | 05/27/2026, 11:44 | 20-user regional load test | [7627120](https://orenlion.grafana.net/a/k6-app/runs/7627120) | ✅ | 10.0m | 3.34 | 3.34 | 0.00 |
| 2026-05-27 | 05/27/2026, 11:35 | 20-user regional load test | [7627065](https://orenlion.grafana.net/a/k6-app/runs/7627065) | ✅ | 10.0m | 3.34 | 3.34 | 0.00 |
| 2026-05-25 | 05/25/2026, 08:58 | Traffic spike benchmark | [7612573](https://orenlion.grafana.net/a/k6-app/runs/7612573) | ✅ | 8.5m | 6.38 | 6.38 | 0.00 |
| 2026-05-25 | 05/25/2026, 08:57 | Traffic spike benchmark | [7612567](https://orenlion.grafana.net/a/k6-app/runs/7612567) | ⚠️ | 0.6m | 1.00 | 1.00 | 0.00 |

## Machine-Readable Comparison

- CSV: [comparison/load-test-runs.csv](comparison/load-test-runs.csv)
- Counter CSV: [comparison/load-test-counters.csv](comparison/load-test-counters.csv)
- SVG charts are stored under [comparison/](comparison/).
