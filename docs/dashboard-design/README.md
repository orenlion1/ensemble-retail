# Dashboard Design Notes

This folder stores dashboard design references used by the Ensemble-Grafana observability work.

## Tufte Threshold Color Standard

Source: `The Tufte Aesthetic for Grafana Dashboard Design.pdf`, section 2, "Strategic Use of Color".

Use bright colors only for meaningful goal states in dashboard thresholds:

| State | Color |
|---|---:|
| Meets goal | `#1eb16a` |
| Close to goal | `#f27d05` |
| Significantly outside goal | `#bd362f` |
| Text-only critical threshold | `#ff3a3a` |

For neutral/non-threshold series, prefer the muted default blue `#437d9e` unless the panel has a stronger semantic reason.
