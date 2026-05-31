# k6 Load Test Comparison

Generated: 2026-05-31T22:58:59.153Z

Source summary: `reports/load-tests/k6-summary-20260531T225850Z.json`

Source run history: `reports/load-tests/k6-runs-20260531T225850Z.json`

Source Faro action totals: `reports/frontend-user-actions/faro-user-action-totals-20260531T225850Z.json`

## Latest Runs

| Test ID | Test | Latest Run | Date | Result | Duration | HTTP Requests | HTTP Failure Rate | HTTP p95 | Check Pass Rate |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|
| 1228494 | API flow load test | n/a | n/a | n/a | n/a | n/a | n/a | n/a | k6 API 404 for /cloud/v6/load_tests/1228494/test_runs?%24top=20&%24orderby=created+desc: {"error":{"message":"Resource matching query does not exist: '1228494'","code":"error"}} |
| 1228490 | 20-user regional load test | n/a | n/a | n/a | n/a | n/a | n/a | n/a | k6 API 404 for /cloud/v6/load_tests/1228490/test_runs?%24top=20&%24orderby=created+desc: {"error":{"message":"Resource matching query does not exist: '1228490'","code":"error"}} |
| 1228496 | Traffic spike benchmark | [7654030](https://orenlion.grafana.net/a/k6-app/runs/7654030) | 05/31/2026, 18:44 | ✅ | 10.0m | n/a | n/a | n/a | n/a |
| 1233226 | Browser action synthetic check | [7652683](https://orenlion.grafana.net/a/k6-app/runs/7652683) | 05/31/2026, 12:41 | ✅ | 0.3m | n/a | n/a | n/a | n/a |

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
| Browser action synthetic check | 1 | 1 | 0 | 0 | 100.00% |
| Traffic spike benchmark | 20 | 7 | 9 | 4 | 35.00% |

## Request And User Action Totals

These totals come from local k6 summary files named `reports/load-tests/k6-local-summary-*.json`. Cloud run history still provides total HTTP requests for latest runs, but per-action counters such as shopping cart add/remove require these local summaries or equivalent exported metric data.

| Date | Generated | Test | HTTP Requests | HTTP Failures | HTTP Failure Rate | User Actions | Cart Adds Total | Add Item | Add Detail | Add Sale | Remove Item | Checkout | API Cart Updates | Checkout Attempts | Region Changes |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2026-05-31 | 05/31/2026, 12:40 | Browser action synthetic check | 140 | 14 | 10.00% | 43 | 4 | 1 | 2 | 1 | 1 | 1 | n/a | n/a | n/a |
| 2026-05-31 | 05/31/2026, 12:39 | Browser action synthetic check | 213 | 0 | 0.00% | 43 | 4 | 1 | 2 | 1 | 1 | 1 | n/a | n/a | n/a |
| 2026-05-31 | 05/31/2026, 12:38 | Browser action synthetic check | 86 | 6 | 6.98% | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
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

Total executions: 60419

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 3650 |
| select-language:swedish | normal | unset | 2962 |
| select-language:american-english | normal | unset | 2960 |
| close-product-detail:mens-midlayer-grid | normal | unset | 2944 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 2944 |
| sort-products:price-low | normal | unset | 2116 |
| navigate-utility:help | normal | unset | 1482 |
| navigate-brand-family:ensemble | normal | unset | 1481 |
| navigate-brand-family:outlet | normal | unset | 1481 |
| navigate-brand-family:regear | normal | unset | 1481 |
| navigate-brand-family:trail-lab | normal | unset | 1481 |
| navigate-header:shop | normal | unset | 1481 |
| navigate-hero:shop-new-arrivals | normal | unset | 1481 |
| navigate-sale:spring-collection-sale | normal | unset | 1481 |
| navigate-utility:find-store | normal | unset | 1481 |
| select-department:mens | normal | unset | 1481 |
| select-department:womens | normal | unset | 1481 |
| select-region:se | normal | unset | 1481 |
| navigate-header:account | normal | unset | 1480 |
| navigate-header:cart | normal | unset | 1480 |
| navigate-sale:shop-all | normal | unset | 1480 |
| select-region:us | normal | unset | 1480 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 1474 |
| select-category:mens-mid-layers | normal | unset | 1473 |
| checkout-dialog:close | normal | unset | 1472 |
| edit-account-email | normal | unset | 1472 |
| edit-shipping-address | normal | unset | 1472 |
| save-account | critical | unset | 1472 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 1472 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 1472 |
| shopping-cart:checkout | critical | unset | 1472 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 1472 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 1472 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 1472 |
| edit-account-name | normal | unset | 1471 |
| select-language:british-english | normal | unset | 2 |
| select-language:french | normal | unset | 2 |
| select-language:mandarin | normal | unset | 2 |
| auth:google-login-error | normal | unset | 1 |
| select-region:ca | normal | unset | 1 |
| select-region:cn | normal | unset | 1 |
| select-region:uk | normal | unset | 1 |
| shopping-cart:add-item:mens-daypack-22 | normal | unset | 1 |
| shopping-cart:add-sale-item:mens-trail-pant | normal | unset | 1 |

## Run History

| Date | Started | Test | Run | Result | Duration | Request/sec | Total VUH | Protocol VUH | Browser VUH |
|---|---|---|---|---:|---:|---:|---:|---:|---:|
| 2026-05-31 | 05/31/2026, 18:44 | Traffic spike benchmark | [7654030](https://orenlion.grafana.net/a/k6-app/runs/7654030) | ✅ | 10.0m | 60 | 90.84 | 82.50 | 8.34 |
| 2026-05-31 | 05/31/2026, 18:28 | Traffic spike benchmark | [7653979](https://orenlion.grafana.net/a/k6-app/runs/7653979) | ❌ | 10.0m | 60 | 90.84 | 82.50 | 8.34 |
| 2026-05-31 | 05/31/2026, 18:04 | Traffic spike benchmark | [7653899](https://orenlion.grafana.net/a/k6-app/runs/7653899) | ❌ | 10.0m | 60 | 90.84 | 82.50 | 8.34 |
| 2026-05-31 | 05/31/2026, 17:43 | Traffic spike benchmark | [7653800](https://orenlion.grafana.net/a/k6-app/runs/7653800) | ❌ | 10.0m | 60 | 90.84 | 82.50 | 8.34 |
| 2026-05-31 | 05/31/2026, 17:16 | Traffic spike benchmark | [7653715](https://orenlion.grafana.net/a/k6-app/runs/7653715) | ✅ | 10.0m | 40 | 90.84 | 82.50 | 8.34 |
| 2026-05-31 | 05/31/2026, 17:14 | Traffic spike benchmark | [7653705](https://orenlion.grafana.net/a/k6-app/runs/7653705) | ⚠️ | 0.8m | n/a | 7.19 | 6.19 | 1.00 |
| 2026-05-31 | 05/31/2026, 16:52 | Traffic spike benchmark | [7653610](https://orenlion.grafana.net/a/k6-app/runs/7653610) | ❌ | 10.0m | 30 | 90.84 | 82.50 | 8.34 |
| 2026-05-31 | 05/31/2026, 16:17 | Traffic spike benchmark | [7653496](https://orenlion.grafana.net/a/k6-app/runs/7653496) | ❌ | 10.0m | 25 | 90.84 | 82.50 | 8.34 |
| 2026-05-31 | 05/31/2026, 15:45 | Traffic spike benchmark | [7653359](https://orenlion.grafana.net/a/k6-app/runs/7653359) | ✅ | 10.0m | 15 | 90.84 | 82.50 | 8.34 |
| 2026-05-31 | 05/31/2026, 15:23 | Traffic spike benchmark | [7653277](https://orenlion.grafana.net/a/k6-app/runs/7653277) | ✅ | 10.0m | 10 | 90.84 | 82.50 | 8.34 |
| 2026-05-31 | 05/31/2026, 14:41 | Traffic spike benchmark | [7653107](https://orenlion.grafana.net/a/k6-app/runs/7653107) | ✅ | 10.0m | 5 | 90.84 | 82.50 | 8.34 |
| 2026-05-31 | 05/31/2026, 13:42 | Traffic spike benchmark | [7652889](https://orenlion.grafana.net/a/k6-app/runs/7652889) | ❌ | 15.0m | 8 | 129.00 | 117.16 | 11.84 |
| 2026-05-31 | 05/31/2026, 12:41 | Browser action synthetic check | [7652683](https://orenlion.grafana.net/a/k6-app/runs/7652683) | ✅ | 0.3m | n/a | 1.00 | 0.00 | 1.00 |
| 2026-05-31 | 05/31/2026, 06:44 | Traffic spike benchmark | [7651472](https://orenlion.grafana.net/a/k6-app/runs/7651472) | ❌ | 15.0m | 8 | 129.00 | 117.16 | 11.84 |
| 2026-05-30 | 05/30/2026, 18:27 | Traffic spike benchmark | [7648780](https://orenlion.grafana.net/a/k6-app/runs/7648780) | ✅ | 15.0m | n/a | 129.00 | 117.16 | 11.84 |
| 2026-05-30 | 05/30/2026, 18:01 | Traffic spike benchmark | [7648612](https://orenlion.grafana.net/a/k6-app/runs/7648612) | ❌ | 15.0m | n/a | 129.00 | 117.16 | 11.84 |
| 2026-05-30 | 05/30/2026, 17:43 | Traffic spike benchmark | [7648492](https://orenlion.grafana.net/a/k6-app/runs/7648492) | ❌ | 15.0m | n/a | 225.99 | 94.35 | 131.64 |
| 2026-05-30 | 05/30/2026, 17:37 | Traffic spike benchmark | [7648480](https://orenlion.grafana.net/a/k6-app/runs/7648480) | ⚠️ | 1.8m | n/a | 30.05 | 12.55 | 17.50 |
| 2026-05-30 | 05/30/2026, 17:36 | Traffic spike benchmark | [7648472](https://orenlion.grafana.net/a/k6-app/runs/7648472) | ⚠️ | 0.5m | n/a | 7.73 | 3.23 | 4.50 |
| 2026-05-30 | 05/30/2026, 16:55 | Traffic spike benchmark | [7648337](https://orenlion.grafana.net/a/k6-app/runs/7648337) | ✅ | 10.0m | n/a | 80.01 | 71.67 | 8.34 |
| 2026-05-30 | 05/30/2026, 16:50 | Traffic spike benchmark | [7648323](https://orenlion.grafana.net/a/k6-app/runs/7648323) | ⚠️ | 1.6m | n/a | 12.41 | 11.11 | 1.30 |

## Machine-Readable Comparison

- CSV: [comparison/load-test-runs.csv](comparison/load-test-runs.csv)
- Counter CSV: [comparison/load-test-counters.csv](comparison/load-test-counters.csv)
- SVG charts are stored under [comparison/](comparison/).
