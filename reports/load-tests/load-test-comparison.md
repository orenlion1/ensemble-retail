# k6 Load Test Comparison

Generated: 2026-05-31T11:03:50.371Z

Source summary: `reports/load-tests/k6-summary-20260531T110345Z.json`

Source run history: `reports/load-tests/k6-runs-20260531T110345Z.json`

Source Faro action totals: `reports/frontend-user-actions/faro-user-action-totals-20260530T210943Z.json`

## Latest Runs

| Test ID | Test | Latest Run | Date | Result | Duration | HTTP Requests | HTTP Failure Rate | HTTP p95 | Check Pass Rate |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|
| 1228494 | API flow load test | n/a | n/a | n/a | n/a | n/a | n/a | n/a | k6 API 404 for /cloud/v6/load_tests/1228494/test_runs?%24top=20&%24orderby=created+desc: {"error":{"message":"Resource matching query does not exist: '1228494'","code":"error"}} |
| 1228490 | 20-user regional load test | n/a | n/a | n/a | n/a | n/a | n/a | n/a | k6 API 404 for /cloud/v6/load_tests/1228490/test_runs?%24top=20&%24orderby=created+desc: {"error":{"message":"Resource matching query does not exist: '1228490'","code":"error"}} |
| 1228496 | Traffic spike benchmark | [7651472](https://orenlion.grafana.net/a/k6-app/runs/7651472) | 05/31/2026, 06:44 | ❌ | 15.0m | n/a | n/a | n/a | n/a |
| 1228497 | Browser action synthetic check | n/a | n/a | n/a | n/a | n/a | n/a | n/a | k6 API 404 for /cloud/v6/load_tests/1228497/test_runs?%24top=20&%24orderby=created+desc: {"error":{"message":"Resource matching query does not exist: '1228497'","code":"error"}} |

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
| Traffic spike benchmark | 20 | 8 | 7 | 5 | 40.00% |

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
| 2026-05-31 | 05/31/2026, 06:44 | Traffic spike benchmark | [7651472](https://orenlion.grafana.net/a/k6-app/runs/7651472) | ❌ | 15.0m | 129.00 | 117.16 | 11.84 |
| 2026-05-30 | 05/30/2026, 18:27 | Traffic spike benchmark | [7648780](https://orenlion.grafana.net/a/k6-app/runs/7648780) | ✅ | 15.0m | 129.00 | 117.16 | 11.84 |
| 2026-05-30 | 05/30/2026, 18:01 | Traffic spike benchmark | [7648612](https://orenlion.grafana.net/a/k6-app/runs/7648612) | ❌ | 15.0m | 129.00 | 117.16 | 11.84 |
| 2026-05-30 | 05/30/2026, 17:43 | Traffic spike benchmark | [7648492](https://orenlion.grafana.net/a/k6-app/runs/7648492) | ❌ | 15.0m | 225.99 | 94.35 | 131.64 |
| 2026-05-30 | 05/30/2026, 17:37 | Traffic spike benchmark | [7648480](https://orenlion.grafana.net/a/k6-app/runs/7648480) | ⚠️ | 1.8m | 30.05 | 12.55 | 17.50 |
| 2026-05-30 | 05/30/2026, 17:36 | Traffic spike benchmark | [7648472](https://orenlion.grafana.net/a/k6-app/runs/7648472) | ⚠️ | 0.5m | 7.73 | 3.23 | 4.50 |
| 2026-05-30 | 05/30/2026, 16:55 | Traffic spike benchmark | [7648337](https://orenlion.grafana.net/a/k6-app/runs/7648337) | ✅ | 10.0m | 80.01 | 71.67 | 8.34 |
| 2026-05-30 | 05/30/2026, 16:50 | Traffic spike benchmark | [7648323](https://orenlion.grafana.net/a/k6-app/runs/7648323) | ⚠️ | 1.6m | 12.41 | 11.11 | 1.30 |
| 2026-05-30 | 05/30/2026, 16:45 | Traffic spike benchmark | [7648315](https://orenlion.grafana.net/a/k6-app/runs/7648315) | ⚠️ | 1.4m | 15.24 | 10.40 | 4.84 |
| 2026-05-30 | 05/30/2026, 16:23 | Traffic spike benchmark | [7648249](https://orenlion.grafana.net/a/k6-app/runs/7648249) | ❌ | 10.0m | 157.34 | 65.69 | 91.65 |
| 2026-05-30 | 05/30/2026, 16:20 | Traffic spike benchmark | [7648230](https://orenlion.grafana.net/a/k6-app/runs/7648230) | ⚠️ | 0.5m | 7.73 | 3.23 | 4.50 |
| 2026-05-30 | 05/30/2026, 15:46 | Traffic spike benchmark | [7648063](https://orenlion.grafana.net/a/k6-app/runs/7648063) | ❌ | 10.0m | 157.34 | 65.69 | 91.65 |
| 2026-05-30 | 05/30/2026, 14:56 | Traffic spike benchmark | [7647787](https://orenlion.grafana.net/a/k6-app/runs/7647787) | ✅ | 10.0m | 73.34 | 71.67 | 1.67 |
| 2026-05-30 | 05/30/2026, 14:40 | Traffic spike benchmark | [7647743](https://orenlion.grafana.net/a/k6-app/runs/7647743) | ✅ | 10.0m | 18.01 | 16.34 | 1.67 |
| 2026-05-30 | 05/30/2026, 10:55 | Traffic spike benchmark | [7646958](https://orenlion.grafana.net/a/k6-app/runs/7646958) | ✅ | 8.5m | 12.75 | 12.75 | 0.00 |
| 2026-05-30 | 05/30/2026, 10:29 | Traffic spike benchmark | [7646874](https://orenlion.grafana.net/a/k6-app/runs/7646874) | ✅ | 8.5m | 6.38 | 6.38 | 0.00 |
| 2026-05-27 | 05/27/2026, 13:05 | Traffic spike benchmark | [7627516](https://orenlion.grafana.net/a/k6-app/runs/7627516) | ❌ | 8.5m | 6.38 | 6.38 | 0.00 |
| 2026-05-27 | 05/27/2026, 12:41 | Traffic spike benchmark | [7627390](https://orenlion.grafana.net/a/k6-app/runs/7627390) | ❌ | 8.5m | 6.38 | 6.38 | 0.00 |
| 2026-05-27 | 05/27/2026, 12:06 | Traffic spike benchmark | [7627249](https://orenlion.grafana.net/a/k6-app/runs/7627249) | ✅ | 8.5m | 6.38 | 6.38 | 0.00 |
| 2026-05-25 | 05/25/2026, 08:58 | Traffic spike benchmark | [7612573](https://orenlion.grafana.net/a/k6-app/runs/7612573) | ✅ | 8.5m | 6.38 | 6.38 | 0.00 |

## Machine-Readable Comparison

- CSV: [comparison/load-test-runs.csv](comparison/load-test-runs.csv)
- Counter CSV: [comparison/load-test-counters.csv](comparison/load-test-counters.csv)
- SVG charts are stored under [comparison/](comparison/).
