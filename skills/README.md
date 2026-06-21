# Ensemble-Grafana Skills

This folder contains reusable `SKILLS.md` playbooks for replicating the Ensemble-Grafana platform pattern in future applications.

- `infrastructure/SKILLS.md` - Terraform stack decomposition, AWS/EKS deployment, domain/TLS, WAF, IAM, and Kubernetes baseline.
- `observability/SKILLS.md` - Grafana Cloud, Faro, Alloy, Beyla, Pyroscope, Synthetic Monitoring, k6, dashboards, and IRM.
- `observability/investigate-log/SKILL.md` - Grafana Cloud log RCA with `gcx`, Grafana Assistant comparison, bounded remediation, and versioned reports.
- `coding/SKILLS.md` - Frontend, Spring Boot services, data ownership, security/config, tests, and app behavior patterns.
- `coding/add-region-localization/SKILL.md` - Add a storefront region, language, locale, catalog localization, Faro action coverage, and browser/k6 validation.
- `dependencies/SKILLS.md` - Workstation/runner dependency installation and validation for Java, Maven, Docker, Terraform, AWS, Kubernetes, Grafana `gcx`, k6, and browser testing.
- `graphviz/SKILL.md` - Create Graphviz DOT diagrams, render local SVG/PNG assets, store them in the repo, and push diagram changes to GitHub.
- `graphviz/dashboard-inventory/SKILL.md` - Inventory the Grafana diagram dashboard by tab and enforce inventory-scoped Grafana diagram pushes.
- `tooling/sync-slash-commands/SKILL.md` - Keep Codex (`.codex/commands`) and Cursor (`.cursor/commands`) slash commands mirrored, with a portable sync/`--check` script.
- `tooling/context-hygiene/SKILL.md` - Keep agent prompts bounded by capping tool output, avoiding broad session/report searches, and auditing Codex session logs for token-growth drivers.

When adding new reusable knowledge from this repo, update the relevant skill and keep examples generic enough to apply to the next application.
