# Observability and Telemetry

## Reconstructed Prompt Category

> Make the platform observable from browser action through service, infrastructure, dashboard, report, and incident workflow.

## Chronology

| Date | Evidence | Evolution |
| --- | --- | --- |
| 2026-05-27 | `bac6d52` Save dashboard: New dashboard | Grafana dashboard assets began entering the repository. |
| 2026-05-28 | `e0c5ad2` Require Faro user-action validation after k6 runs | Faro validation became mandatory after load tests. |
| 2026-05-29 | `6d163c0` Add Grafana RDS CloudWatch scrape job | Database CloudWatch telemetry was added. |
| 2026-05-29 | `7a0857e` Tag data resources for Grafana CloudWatch discovery | AWS resources were tagged for Grafana discovery. |
| 2026-05-30 | `08168eb` Document frontend Faro action reporting | Frontend action reporting became documented practice. |
| 2026-05-30 | `a7df7b7` Add GCX Faro action totals to load report | Load reports began pulling Grafana Cloud Faro totals. |
| 2026-05-31 | `4df5112` Standardize Grafana dashboard threshold colors | Dashboard color semantics were standardized. |
| 2026-05-31 | `0f8a6cd` Standardize Grafana neutral dashboard colors | Neutral dashboard palette rules were tightened. |
| 2026-06-01 | `210b96b` Add Faro action report to load test history | Faro action history became part of recurring report output. |

## What This Category Produced

- Grafana Cloud dashboards and datasource conventions.
- Faro browser user-action validation and reporting.
- Alloy and Beyla telemetry wiring.
- CloudWatch discovery for AWS data resources.
- GCX-backed operational reporting that joins local k6 data with Grafana Cloud action totals.

## Current Artifacts

- [observability](../../../observability)
- [observability/README.md](../../../observability/README.md)
- [skills/observability/SKILLS.md](../../../skills/observability/SKILLS.md)
- [reports/frontend-user-actions](../../../reports/frontend-user-actions)
- [reports/load-tests/load-test-comparison.md](../../../reports/load-tests/load-test-comparison.md)
