# Grafana Diagram Dashboard Inventory

This inventory records the diagrams that are intentionally published to the Grafana dashboard `Ensemble Graphviz Diagrams`.

Dashboard URL: `https://orenlion.grafana.net/d/ensemble-graphviz-diagrams/ensemble-graphviz-diagrams`

Last inventoried from Grafana: `2026-05-31`

## Policy

Only push diagram updates to this Grafana dashboard when the changed diagram source is listed in this inventory. If a new diagram belongs in Grafana, add it to this inventory in the same change before pushing the dashboard update.

Keep dashboard updates scoped to the affected inventory entry. Avoid rewriting unrelated panels, tabs, layout, or generated metadata unless Grafana returns those fields after a successful update.

## Inventory By Tab

| Tab | Panel | Title | Source |
|-----|-------|-------|--------|
| Network | `panel-1` | Network Diagram | `docs/diagrams/network-diagram.dot` |
| Network | `panel-3` | Request Flow Diagram | `docs/diagrams/request-flow-diagram.dot` |
| Observability | `panel-11` | Observability Architecture | `docs/diagrams/observability-capabilities-flow.dot` |
| Load Test | `panel-16` | Traffic Spike Target Heatmap Dark | `docs/graphviz/traffic-spike-target-heatmap-dark.dot` |
| Load Test | `panel-17` | Load Run History Table | `docs/graphviz/load-run-table.dot` |
| Load Test | `panel-18` | Traffic Spike User Action Fidelity | `docs/graphviz/traffic-spike-load-test-flow.dot` |
| Observability Architecture | `panel-19` | Faro, k6, and Synthetic Monitoring Contract | `docs/graphviz/faro-k6-contract-relationships.dot` |

## Refresh Command

Use this command to inspect the live dashboard before editing:

```sh
gcx dashboards get ensemble-graphviz-diagrams -o json > /tmp/ensemble-graphviz-diagrams-live.json
jq '{tabs:(.spec.layout.spec.tabs | map({title:.spec.title, panels:(.spec.layout.spec.items | map(.spec.element.name))})), panels:(.spec.elements | to_entries | map({key:.key, title:.value.spec.title, description:.value.spec.description}))}' /tmp/ensemble-graphviz-diagrams-live.json
```
