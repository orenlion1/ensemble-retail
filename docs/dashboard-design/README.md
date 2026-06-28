# Dashboard Design Notes

This folder stores dashboard design references used by the Ensemble-Retail observability work.

## Tufte Color Standards

Source: `The Tufte Aesthetic for Grafana Dashboard Design.pdf`, section 2, "Strategic Use of Color".

Use muted blue as the neutral/default visualization color so bright colors remain meaningful:

| Usage | Setting |
|---|---:|
| Neutral/default visualization color | `#437d9e` |
| Stat/Singlestat background coloring | `colorMode: none` |

Use bright colors only for meaningful goal states in dashboard thresholds:

| State | Color |
|---|---:|
| Meets goal | `#1eb16a` |
| Close to goal | `#f27d05` |
| Significantly outside goal | `#bd362f` |
| Text-only critical threshold | `#ff3a3a` |
