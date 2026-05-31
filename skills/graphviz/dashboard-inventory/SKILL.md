---
name: grafana-diagram-dashboard-inventory
description: Maintain and enforce the Ensemble-Grafana Graphviz dashboard inventory before pushing diagram updates to Grafana. Use when inventorying dashboard tabs, updating a diagram panel, adding a diagram to the dashboard, or deciding whether a Grafana diagram push is allowed.
---

# Grafana Diagram Dashboard Inventory

Use this skill before pushing Graphviz diagram changes to Grafana dashboards.

## Source Of Truth

The dashboard inventory lives at:

```text
docs/graphviz/grafana-dashboard-diagram-inventory.md
```

The inventory maps each Grafana dashboard tab and panel ID to the diagram source file that is allowed to update that panel.

## Rule

Only push diagram updates to Grafana when the changed diagram source is listed in the inventory.

If a new diagram should appear in Grafana:

1. Create and validate the DOT/SVG/PNG assets using `skills/graphviz/SKILL.md`.
2. Add the new tab/panel/source mapping to `docs/graphviz/grafana-dashboard-diagram-inventory.md`.
3. Update the dashboard manifest for that one panel or tab.
4. Push the dashboard with `gcx`.
5. Fetch the dashboard back from Grafana and copy the returned JSON into the repo manifest.
6. Validate the live dashboard through Grafana MCP before considering the dashboard change complete.

If the changed diagram is not in the inventory and the task does not explicitly add it to Grafana, do not push the dashboard.

## Workflow

1. Fetch the live dashboard:

```sh
gcx dashboards get ensemble-graphviz-diagrams -o json > /tmp/ensemble-graphviz-diagrams-live.json
```

2. Compare live tabs and panels with the checked-in inventory:

```sh
jq '{tabs:(.spec.layout.spec.tabs | map({title:.spec.title, panels:(.spec.layout.spec.items | map(.spec.element.name))})), panels:(.spec.elements | to_entries | map({key:.key, title:.value.spec.title, description:.value.spec.description}))}' /tmp/ensemble-graphviz-diagrams-live.json
```

3. Identify changed diagram sources:

```sh
git diff --name-only -- docs/diagrams docs/graphviz
```

4. Push only affected inventory panels.

When modifying `observability/grafana/dashboards/ensemble-graphviz-diagrams-api.json`, start from the live dashboard JSON and update only the panel whose source file changed. Avoid broad JSON rewrites.

5. Publish and verify:

```sh
gcx dashboards update ensemble-graphviz-diagrams -f observability/grafana/dashboards/ensemble-graphviz-diagrams-api.json
gcx dashboards get ensemble-graphviz-diagrams -o json > /tmp/ensemble-graphviz-diagrams-after.json
```

Copy the verified dashboard JSON back to:

```text
observability/grafana/dashboards/ensemble-graphviz-diagrams-api.json
```

6. Validate the live dashboard with Grafana MCP:

- Use `search_dashboards` to confirm `Ensemble Graphviz Diagrams` resolves to the expected UID.
- Use `get_dashboard_by_uid` or `get_dashboard_property` to confirm the changed tab, panel ID, panel title, and Graphviz DOT source are present in the live dashboard.
- For visual or layout-sensitive changes, use `get_panel_image` on the changed panel and confirm the rendered image is not blank and reflects the intended diagram.
- Keep `gcx` for deterministic publishing and JSON snapshots; use Grafana MCP as the read-after-write semantic validation layer.

## Validation

- The changed DOT renders to SVG and PNG.
- The SVG is valid XML.
- The source DOT is listed in the inventory before the Grafana push.
- The fetched dashboard contains the expected tab, panel ID, panel title, and DOT source.
- Grafana MCP validates the same live dashboard change after publish, including a panel image check when the change affects visual output.
- README points to the inventory when diagram dashboard behavior changes.
