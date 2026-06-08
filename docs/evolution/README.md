# Ensemble-Grafana Evolution

This directory explains how Ensemble-Grafana was built end to end, organized by reconstructed prompt category.

The source material is the repo itself: commit chronology, documentation, reports, Graphviz artifacts, load-test outputs, and operational runbooks. Literal prompt transcripts are not stored in this repository, so prompt categories below are inferred from committed work.

## Visual Timeline

![Ensemble-Grafana evolution timeline](diagrams/ensemble-evolution-timeline.png)

Diagram files:

- [diagrams/ensemble-evolution-timeline.dot](diagrams/ensemble-evolution-timeline.dot)
- [diagrams/ensemble-evolution-timeline.svg](diagrams/ensemble-evolution-timeline.svg)
- [diagrams/ensemble-evolution-timeline.png](diagrams/ensemble-evolution-timeline.png)

## Category Files

| Category | File |
| --- | --- |
| Product seed and framing | [categories/product-seed.md](categories/product-seed.md) |
| Application and storefront | [categories/application-storefront.md](categories/application-storefront.md) |
| Infrastructure and deployment | [categories/infrastructure-deployment.md](categories/infrastructure-deployment.md) |
| Observability and telemetry | [categories/observability-telemetry.md](categories/observability-telemetry.md) |
| Load testing and resilience | [categories/load-testing-resilience.md](categories/load-testing-resilience.md) |
| Incidents and operations | [categories/incidents-operations.md](categories/incidents-operations.md) |
| Diagrams and communication | [categories/diagrams-communication.md](categories/diagrams-communication.md) |
| Agent skills and automation | [categories/agent-skills-automation.md](categories/agent-skills-automation.md) |

## Reading Order

1. Start with [../../EVOLUTION.md](../../EVOLUTION.md) for the full chronological overview.
2. Use the visual timeline for the end-to-end build path.
3. Open a category file when you want the prompt pattern, milestone trail, and source artifacts behind a particular part of the system.
