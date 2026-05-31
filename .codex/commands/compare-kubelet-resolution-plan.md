# /compare-kubelet-resolution-plan

Compare the local kubelet log resolution plan with Grafana Assistant's resolution plan.

## Intent

Use this command after querying kubelet error logs through Grafana MCP and drafting a local resolution plan. It asks Grafana Assistant to analyze the same kubelet error-log scope, produce its own resolution plan, and compare it with the local plan.

## Workflow

1. Keep this read-only. Do not modify Kubernetes, Grafana, or repo files while running the comparison.
2. Call Grafana Assistant through `gcx assistant prompt`.
3. Use the same kubelet log-analysis prompt that produced the local `Resolution Plan`.
4. Ask Grafana Assistant to return:

- Top recurring kubelet error patterns.
- Representative timestamps, messages, instances, nodes, pods, or services.
- Its own remediation plan.
- A comparison against the local resolution plan, including agreements, gaps, and additional checks.

## Command

```sh
gcx assistant prompt 'Use Grafana Cloud logs to analyze kubelet ERROR-level/error messages from the ensemble-grafana cluster. Use this selector as the base: {job="integrations/kubernetes/journal", k8s_cluster_name="ensemble-grafana", unit="kubelet.service"}. Filter for ERROR messages or error/failure/OOM/eviction patterns, but exclude generic warnings unless paired with error/fail/oom/evict/backoff/crash. Search the last 6 hours and return: top recurring error patterns, representative timestamps/messages, affected instance/node if present, and a concise remediation plan.

Compare your remediation plan with this local Resolution Plan:
1. Inspect inventory-service around 2026-05-31T10:44Z-10:58Z: restarts, app logs, startup time, and /actuator/health/readiness.
2. If startup is slow, tune probes: increase initialDelaySeconds, timeoutSeconds, or failureThreshold.
3. If overload caused timeouts, inspect inventory CPU/memory, DB latency, and request saturation during that window.
4. Treat containerd NotFound cleanup errors as cleanup noise unless they continue outside pod rollouts.
5. Add or confirm dashboard panels for kubelet probe failures by service/pod/node so this pattern is visible during load runs.

Return a concise side-by-side comparison: agreements, differences, missing checks, and the recommended final plan.'
```

## Notes

- Grafana Assistant requires OAuth/user auth; service account tokens may fail with `invalid user`.
- Keep normal `gcx` flows isolated from Assistant auth. If needed, use a temporary shell override rather than changing the default `gcx` config token.
- If `gcx assistant prompt` fails auth, run `grafana-assistant auth` or `codex mcp login grafana` as appropriate for the active tool path, then retry.
