# k6 Load Test Comparison

Generated: 2026-05-30T21:09:48.379Z

Source summary: `reports/load-tests/k6-summary-20260530T131841Z.json`

Source run history: `reports/load-tests/k6-runs-20260530-091706.json`

Source Faro action totals: `reports/frontend-user-actions/faro-user-action-totals-20260530T210943Z.json`

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
| 2026-05-30 | 05/30/2026, 16:54 | Browser action synthetic check | 123 | 14 | 11.38% | 31 | 4 | 1 | 2 | 1 | 1 | 1 | n/a | n/a | n/a |
| 2026-05-30 | 05/30/2026, 16:18 | Browser action synthetic check | 135 | 14 | 10.37% | 31 | 4 | 1 | 2 | 1 | 1 | 1 | n/a | n/a | n/a |
| 2026-05-30 | 05/30/2026, 15:31 | Browser action synthetic check | 135 | 14 | 10.37% | 31 | 4 | 1 | 2 | 1 | 1 | 1 | n/a | n/a | n/a |
| 2026-05-30 | 05/30/2026, 15:28 | Browser action synthetic check | 202 | 0 | 0.00% | 31 | 4 | 1 | 2 | 1 | 1 | 1 | n/a | n/a | n/a |
| 2026-05-30 | 05/30/2026, 15:23 | Browser action synthetic check | 135 | 14 | 10.37% | 31 | 4 | 1 | 2 | 1 | 1 | 1 | n/a | n/a | n/a |
| 2026-05-30 | 05/30/2026, 15:20 | Browser action synthetic check | 202 | 0 | 0.00% | 31 | 4 | 1 | 2 | 1 | 1 | 1 | n/a | n/a | n/a |
| 2026-05-30 | 05/30/2026, 15:20 | Browser action synthetic check | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| 2026-05-30 | 05/30/2026, 15:19 | Browser action synthetic check | 135 | 14 | 10.37% | 31 | 4 | 1 | 2 | 1 | 1 | 1 | n/a | n/a | n/a |
| 2026-05-30 | 05/30/2026, 14:43 | Browser action synthetic check | 202 | 0 | 0.00% | 31 | 4 | 1 | 2 | 1 | 1 | 1 | n/a | n/a | n/a |
| 2026-05-30 | 05/30/2026, 14:34 | Browser action synthetic check | 202 | 0 | 0.00% | 31 | 4 | 1 | 2 | 1 | 1 | 1 | n/a | n/a | n/a |
| 2026-05-30 | 05/30/2026, 14:29 | Combined traffic spike, regional, and browser-action benchmark | 174425 | 2617 | 1.50% | 31 | 4 | 1 | 2 | 1 | 1 | 1 | 6174 | 1377 | 11586 |
| 2026-05-30 | 05/30/2026, 10:58 | Browser action synthetic check | 135 | 14 | 10.37% | 31 | 4 | 1 | 2 | 1 | 1 | 1 | n/a | n/a | n/a |

## Grafana Faro User Action Executions

These totals come from the latest `gcx logs query` output under `reports/frontend-user-actions/faro-user-action-totals-*.json`. They use the latest sample from a rolling `6h` `count_over_time` query to show what Grafana Cloud received after k6 browser-action runs.

Total executions: 26870

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 2361 |
| select-language:swedish | normal | unset | 1926 |
| select-language:american-english | normal | unset | 1916 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 1853 |
| close-product-detail:mens-midlayer-grid | normal | unset | 1845 |
| sort-products:price-low | normal | unset | 1226 |
| select-region:se | normal | unset | 963 |
| select-region:us | normal | unset | 958 |
| select-department:womens | normal | unset | 956 |
| select-department:mens | normal | unset | 949 |
| select-category:mens-mid-layers | normal | unset | 945 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 934 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 925 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 922 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 918 |
| shopping-cart:checkout | critical | unset | 913 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 912 |
| checkout-dialog:close | normal | unset | 911 |
| edit-account-name | normal | unset | 907 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 905 |
| edit-account-email | normal | unset | 900 |
| edit-shipping-address | normal | unset | 900 |
| save-account | critical | unset | 898 |
| shopping-cart:add-sale-item:womens-softshell-hoody | normal | unset | 6 |
| shopping-cart:add-sale-item:mens-trail-pant | normal | unset | 3 |
| select-language:british-english | normal | unset | 2 |
| select-language:french | normal | unset | 2 |
| select-language:mandarin | normal | unset | 2 |
| shopping-cart:add-item:mens-daypack-22 | normal | unset | 2 |
| auth:google-login-complete | normal | unset | 1 |
| auth:google-login-start | normal | unset | 1 |
| navigate-checkout:grafana | normal | unset | 1 |
| navigate-header:cart | normal | unset | 1 |
| select-region:ca | normal | unset | 1 |
| select-region:cn | normal | unset | 1 |
| select-region:uk | normal | unset | 1 |
| shopping-cart:checkout | normal | unset | 1 |
| shopping-cart:remove-item:womens-rain-cap | normal | unset | 1 |
| view-product:product-grid-mens-shell-alpha | normal | unset | 1 |

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
