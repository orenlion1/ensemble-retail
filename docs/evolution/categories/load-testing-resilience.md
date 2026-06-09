# Load Testing and Resilience

## Reconstructed Prompt Category

> Exercise the system under realistic API and browser traffic, preserve the run data, compare it over time, and use failures to tune the platform.

## Chronology

| Date | Evidence | Evolution |
| --- | --- | --- |
| 2026-05-28 | `0503f1c` Update k6 load tests to include Faro browser actions. | k6 started validating browser actions as well as protocol traffic. |
| 2026-05-29 | `857e906` Require k6 browser validation after frontend deploys | Frontend deployment validation was connected to browser-action k6 tests. |
| 2026-05-30 | `8295fb1` Add k6 load test comparison report | Comparison reporting began. |
| 2026-05-30 | `3068ad9` Require load test comparison reports | Comparison reports became required after k6 runs. |
| 2026-05-30 | `827c80f` Increase k6 load test baselines | Load expectations increased. |
| 2026-05-30 | `1f756dd` Default traffic spike load test to cloud k6 | Traffic-spike runs moved toward Grafana Cloud k6 execution. |
| 2026-05-30 | `62cadf0` Record passing traffic spike load test report | A passing traffic-spike report was preserved. |
| 2026-05-31 | `c99e3b4` Record passing 40 rps traffic spike run | A higher-confidence 40 rps run was documented. |
| 2026-05-31 | `a3a5670` Set traffic spike baseline to 60 rps | Baseline increased. |
| 2026-06-02 | `6daf6d7` Raise traffic spike load to 120 rps | Baseline increased again to 120 rps. |
| 2026-06-08 | `b5273e4` Update load test report for run 7716954 | New load-test evidence was committed. |
| 2026-06-08 | `60de963` Update load test report for run 7718235 | Latest visible load-test report was committed. |

## What This Category Produced

- k6 protocol and browser scenarios covering shopper behavior.
- A traffic-spike model with staged VU and request-pressure evolution.
- Report generation for HTTP failure rate, check pass rate, p95 latency, user-action totals, and run comparisons.
- A preserved run history across passing and failing exercises.

## Current Artifacts

- [load-tests](../../../load-tests)
- [scripts/report-load-tests.mjs](../../../scripts/report-load-tests.mjs)
- [reports/load-tests/load-test-comparison.md](../../../reports/load-tests/load-test-comparison.md)
- [docs/graphviz/load-run-table.png](../../graphviz/load-run-table.png)
