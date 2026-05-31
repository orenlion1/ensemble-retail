---
name: investigate-log
description: Use when investigating production logs with Grafana Cloud, gcx, Loki queries, Grafana Assistant comparison, remediation, and versioned reports. Applies to kubelet, Kubernetes, service, Faro, Alloy, and other operational log RCA tasks.
---

# Investigate Log

Use this skill for log-driven RCA where the expected output is a concrete resolution plan, optional remediation, and a versioned report artifact.

## Workflow

1. Define the scope in plain terms: cluster/service, datasource, time window, and failure pattern.
2. Run the primary `gcx logs query` or `gcx logs metrics` query and save machine-readable output under `reports/<topic>/`.
3. Run Grafana Assistant with the same investigation prompt through the OAuth context:

```sh
gcx assistant prompt --context assistant-oauth --timeout 300 '<same investigation prompt>'
```

4. Compare local findings with Grafana Assistant:
   - shared root causes
   - differences in weighting or affected resources
   - concrete remediation
   - residual risks and monitoring follow-up
5. Implement only a bounded remediation that is directly supported by the logs. Avoid broad cluster/runtime changes when the evidence points to one workload.
6. Rerun the same queries after remediation. Add a short post-change query window when validating whether new errors are still appearing.
7. Generate a timestamped report plus `latest` aliases:
   - `reports/<topic>/<name>-YYYY-MM-DDTHH-MM-SS-sssZ.html`
   - `reports/<topic>/<name>-YYYY-MM-DDTHH-MM-SS-sssZ.pdf`
   - `reports/<topic>/<name>-latest.html`
   - `reports/<topic>/<name>-latest.pdf`

## Kubelet Probe RCA Pattern

Use this query for kubelet error/failure scans:

```sh
gcx logs query -d grafanacloud-logs \
  '{job="integrations/kubernetes/journal", k8s_cluster_name="ensemble-grafana", unit="kubelet.service"} |~ "(?i)error|warning|failed|evict|oom|backoff|crash"' \
  --since 6h -o json --limit 100 --no-truncate \
  > reports/kubelet-resolution-plan/kubelet-errors-latest.json
```

Use this query for application probe grouping:

```sh
gcx logs metrics -d grafanacloud-logs \
  'sum by(containerName, pod, probeType, instance) (count_over_time({job="integrations/kubernetes/journal", k8s_cluster_name="ensemble-grafana", unit="kubelet.service", instance=~".+"} |= "Probe failed" | logfmt | containerName=~"inventory-service|cart-service|account-service" [6h]))' \
  -o json --no-truncate \
  > reports/kubelet-resolution-plan/kubelet-probe-failures-latest.json
```

Use this short window after remediation:

```sh
gcx logs query -d grafanacloud-logs \
  '{job="integrations/kubernetes/journal", k8s_cluster_name="ensemble-grafana", unit="kubelet.service"} |~ "(?i)error|warning|failed|evict|oom|backoff|crash"' \
  --since 15m -o json --limit 100 --no-truncate \
  > reports/kubelet-resolution-plan/kubelet-errors-post-change.json
```

## Reporting Guidance

The report should include:

- commands run
- time windows
- grouped query results
- local resolution plan
- Grafana Assistant resolution plan
- side-by-side comparison
- implemented remediation
- post-change validation
- next monitoring action

For dashboard-related findings, update the dashboard through `gcx dashboards update` and validate with Grafana MCP according to `skills/observability/SKILLS.md`.

## Documentation

- Update `README.md` for every implemented remediation or dashboard change.
- Update `DIAGRAMS.md` only when architecture, request flow, telemetry flow, network boundaries, or operational dependencies change.
- Include the versioned report artifact in the change when the user asks for a pushed investigation report.
