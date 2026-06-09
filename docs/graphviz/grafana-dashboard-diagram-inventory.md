# Grafana Diagram Dashboard Inventory

This inventory records the diagrams that are intentionally published to Grafana dashboards from repo Graphviz sources.

- Ensemble Graphviz Diagrams: `https://orenlion.grafana.net/d/ensemble-graphviz-diagrams/ensemble-graphviz-diagrams`
- User Action Traffic: Real Users vs k6: `https://orenlion.grafana.net/d/or46lql/user-action-traffic3a-real-users-vs-k6`

Last inventoried from Grafana: `2026-06-09`

## Policy

Only push diagram updates to this Grafana dashboard when the changed diagram source is listed in this inventory. If a new diagram belongs in Grafana, add it to this inventory in the same change before pushing the dashboard update.

Keep dashboard updates scoped to the affected inventory entry. Avoid rewriting unrelated panels, tabs, layout, or generated metadata unless Grafana returns those fields after a successful update.

## Inventory By Tab

| Dashboard | Tab | Panel | Title | Source |
|-----------|-----|-------|-------|--------|
| Ensemble Graphviz Diagrams | Network | `panel-1` | Network Diagram | `docs/diagrams/network-diagram.dot` |
| Ensemble Graphviz Diagrams | Request Flow | `panel-3` | Request Flow Diagram | `docs/diagrams/request-flow-diagram.dot` |
| Ensemble Graphviz Diagrams | Observability | `panel-11` | Observability Architecture | `docs/diagrams/observability-capabilities-flow-presentation.dot` |
| Ensemble Graphviz Diagrams | Traffic Spike Design | `panel-18` | Traffic Spike User Action Fidelity | `docs/graphviz/traffic-spike-load-test-flow.dot` |
| Ensemble Graphviz Diagrams | Frontend Observability | `panel-19` | Faro, k6, and Synthetic Monitoring Contract | `docs/graphviz/faro-k6-contract-relationships.dot` |
| Ensemble Graphviz Diagrams | Evolution | `panel-20` | Ensemble Evolution Timeline | `docs/evolution/diagrams/ensemble-evolution-timeline-dark.dot` |
| User Action Traffic: Real Users vs k6 | Load Run History | `panel-17` | Load Run History Table | `docs/graphviz/load-run-table.dot` |

## Refresh Command

Use this command to inspect the live dashboard before editing:

```sh
gcx dashboards get ensemble-graphviz-diagrams -o json > /tmp/ensemble-graphviz-diagrams-live.json
jq '{tabs:(.spec.layout.spec.tabs | map({title:.spec.title, panels:(.spec.layout.spec.items | map(.spec.element.name))})), panels:(.spec.elements | to_entries | map({key:.key, title:.value.spec.title, description:.value.spec.description}))}' /tmp/ensemble-graphviz-diagrams-live.json
```
