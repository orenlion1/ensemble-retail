# Incidents and Operations

## Reconstructed Prompt Category

> Treat the demo like an operational service: create incidents, investigate logs, compare remediation plans, and preserve reports.

## Chronology

| Date | Evidence | Evolution |
| --- | --- | --- |
| 2026-05-30 | `3c8201b` Add observability diagrams and incident artifacts | Incident artifacts entered the repo alongside observability diagrams. |
| 2026-05-31 | `6d1e451` Add kubelet resolution plan comparison alias | A repeatable local versus Grafana Assistant comparison path was added. |
| 2026-05-31 | `16ddb4b` Add log investigation skill and kubelet probe report | Log RCA workflow became a repo-local skill with report output. |
| 2026-05-31 | `f0f85c7` Add remaining kubelet investigation reports | Additional kubelet investigation evidence was preserved. |
| 2026-05-31 | `9ddee30` Document SRE IRM on-call setup | IRM on-call operations were documented. |
| 2026-06-02 | `f80bced` Record Black Friday cart add incident | A named retail traffic incident was recorded. |
| 2026-06-18 | pending | Incident creation policy began requiring a `detection` label, `scripts/generate-incident.sh` started emitting `detection=manual` by default, and `detection=call-in` was added for phone-reported incidents. |

## What This Category Produced

- Grafana IRM incident templates, generated manifests, push summaries, and required `region`/`feature`/`service`/`detection` labels.
- Kubelet log investigation reports and comparison workflow with Grafana Assistant.
- SRE on-call setup documentation.
- A stronger habit of preserving operational state after exercises.

## Current Artifacts

- [docs/grafana-irm.md](../../grafana-irm.md)
- [observability/irm](../../../observability/irm)
- [skills/observability/investigate-log/SKILL.md](../../../skills/observability/investigate-log/SKILL.md)
- [skills/observability/incident-creation/SKILL.md](../../../skills/observability/incident-creation/SKILL.md)
- [reports/kubelet-resolution-plan](../../../reports/kubelet-resolution-plan)
