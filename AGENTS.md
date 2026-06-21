# Agent Policy

This repository treats infrastructure, deployment, and observability changes as user-facing operational changes. Any agent that changes those areas must update the docs in the same change.

## Agent Skills and Personas

### Discovery

- Start with the `using-agent-skills` skill from [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/main/skills/using-agent-skills).
- For Ensemble-specific work, prefer repo playbooks under `skills/` before generic catalog skills.

### Repo-local skills (this repository)

| Area | Skill |
|------|-------|
| Terraform, AWS, EKS, K8s | `skills/infrastructure/SKILLS.md` |
| Grafana Cloud, Faro, Alloy, k6, dashboards | `skills/observability/SKILLS.md` |
| Log investigation and RCA reports | `skills/observability/investigate-log/SKILL.md` |
| IRM incidents and labels | `skills/observability/incident-creation/SKILL.md` |
| Graphviz diagrams | `skills/graphviz/SKILL.md` |
| Grafana diagram dashboard inventory | `skills/graphviz/dashboard-inventory/SKILL.md` |
| Codex/Cursor slash command sync | `skills/tooling/sync-slash-commands/SKILL.md` |
| Agent context and token growth | `skills/tooling/context-hygiene/SKILL.md` |
| Frontend and Spring Boot services | `skills/coding/SKILLS.md` |
| Storefront region/localization additions | `skills/coding/add-region-localization/SKILL.md` |
| Toolchain install and validation | `skills/dependencies/SKILLS.md` |

Index: `skills/README.md`.

### Shared catalog skills

- [test-driven-development](https://github.com/addyosmani/agent-skills/tree/main/skills/test-driven-development) — behavioral changes in services or frontend
- [security-and-hardening](https://github.com/addyosmani/agent-skills/tree/main/skills/security-and-hardening) — auth, secrets, and untrusted input boundaries
- [browser-testing-with-devtools](https://github.com/addyosmani/agent-skills/tree/main/skills/browser-testing-with-devtools) — browser verification with Chrome DevTools MCP or active browser tooling
- [frontend-ui-engineering](https://github.com/addyosmani/agent-skills/tree/main/skills/frontend-ui-engineering) — frontend implementation work

### Personas

Personas provide a single perspective and output format. The user (or main agent) orchestrates them; personas do not invoke other personas.

| Persona | Use when |
|---------|----------|
| `code-reviewer` | Pre-merge review of a change set |
| `security-auditor` | Security-focused pass on auth, secrets, or exposure |
| `test-engineer` | Test strategy and gaps (unit, k6, browser flows) |

Persona definitions: `agents/code-reviewer.md`, `agents/security-auditor.md`, `agents/test-engineer.md` (see `agents/README.md`). In Cursor, `security-auditor` is always applied via `.cursor/rules/security-auditor.mdc`.

For large cross-cutting changes (deploy + observability + app code), run `code-reviewer`, `security-auditor`, and `test-engineer` in parallel, merge in the main session, then apply the documentation rules below.

### Intent routing (Ensemble)

| Task | Primary skill | Persona (optional) |
|------|---------------|-------------------|
| Terraform / K8s / deploy | `skills/infrastructure/SKILLS.md` | `security-auditor` |
| Grafana / k6 / Faro / IRM | `skills/observability/SKILLS.md` (+ `incident-creation` for incidents) | `test-engineer` |
| Log investigation and RCA reports | `skills/observability/investigate-log/SKILL.md` + relevant domain skill | `test-engineer` |
| Graphviz diagram creation or generated diagram assets | `skills/graphviz/SKILL.md` | `test-engineer` |
| Grafana diagram dashboard push | `skills/graphviz/SKILL.md` + `skills/graphviz/dashboard-inventory/SKILL.md` | `test-engineer` |
| App or API behavior | `skills/coding/SKILLS.md` + `test-driven-development` | `code-reviewer` |
| New storefront region or language | `skills/coding/add-region-localization/SKILL.md` + `frontend-ui-engineering` + `browser-testing-with-devtools` | `test-engineer` |
| Tooling setup | `skills/dependencies/SKILLS.md` | — |
| Add/edit a Codex or Cursor `/command` | `skills/tooling/sync-slash-commands/SKILL.md` | — |
| Agent context or prompt-token growth | `skills/tooling/context-hygiene/SKILL.md` | `test-engineer` |
| Frontend UI change | `skills/coding/SKILLS.md` + `frontend-ui-engineering` + `browser-testing-with-devtools` | `test-engineer` |
| Large cross-cutting PR | repo skills as needed | parallel: `code-reviewer`, `security-auditor`, `test-engineer` |

## Context Hygiene

- Treat large tool outputs as operational risk. Prefer targeted commands, narrow globs, and field selection over broad recursive searches or full-file dumps.
- Set explicit output caps on exploratory commands. Default to `max_output_tokens` at or below `6000`; raise it only when the full output is required for the current decision.
- Do not run broad searches over `.codex/sessions`, `.codex/archived_sessions`, `node_modules`, build outputs, or generated report trees unless the task explicitly needs those files. Scope searches by date, filename, or known directory first.
- When a command returns a large result, summarize the relevant facts in the next message and avoid re-reading or re-emitting the same raw output.
- For Codex session audits, run `node scripts/audit-codex-token-context.mjs <session-jsonl>` and use the top oversized tool outputs to decide what should have been narrowed or summarized.

## Required Documentation Updates

- Update `README.md` for every infrastructure or observability change, including Terraform stacks, Kubernetes manifests, CloudFront/API routing, Grafana Cloud, Faro, Alloy, Beyla, Pyroscope, Synthetic Monitoring, k6, alerting, incidents, secrets, certificates, DNS, WAF, and deployment commands.
- Document reusable `gcx` permission dependencies in `skills/observability/SKILLS.md`. Keep `README.md` focused on this deployment's concrete token locations, current auth blockers, stack URLs, command examples, and observed resource IDs.
- Update `DIAGRAMS.md` whenever a change affects architecture, request flow, network boundaries, telemetry flow, data stores, identity/auth, CI/load testing, or operational dependencies.
- Whenever `DIAGRAMS.md` changes, regenerate the Graphviz DOT sources plus SVG and PNG exports in `docs/diagrams/` so the rendered files stay in sync with the authoritative diagrams.
- Update `EVOLUTION.md` and the matching `docs/evolution/categories/` file whenever a committed change becomes a key project milestone, changes the end-to-end build story, adds or revises repo policy/skills/personas, publishes major diagrams, changes CI/load-test baselines, records notable operational evidence, or otherwise changes how Ensemble should be explained from first prompt to current state.
- Whenever `EVOLUTION.md` changes because of timeline content, update `docs/evolution/README.md` if the reading path changes, then regenerate `docs/evolution/diagrams/ensemble-evolution-timeline.{dot,svg,png}` when the visual chronology changes.
- Whenever the evolution timeline changes, also update `docs/evolution/diagrams/ensemble-evolution-timeline-dark.dot` and publish it to the `Evolution` tab of the Grafana dashboard `Ensemble Graphviz Diagrams` (`panel-20`) after confirming the source is listed in `docs/graphviz/grafana-dashboard-diagram-inventory.md`.
- If no diagram update is needed, mention that in the work summary and explain why the existing diagrams still match the system.

## Documentation Quality Bar

- Keep commands copy-pasteable and identify required environment variables or secrets without exposing secret values.
- Prefer concrete resource names, stack names, namespaces, URLs, and file paths over vague descriptions.
- Record known blockers and current operational state when a command works only after a manual step.
- Keep diagrams high-level but accurate enough to explain ownership boundaries and traffic/telemetry paths.

## Verification

- After updating docs, skim the edited sections for stale links, duplicated instructions, and contradictions.
- After changing `DIAGRAMS.md`, verify the generated PNG files exist in `docs/diagrams/` and render successfully.
- For all coding changes that implement logic, fix bugs, or change behavior, follow `test-driven-development`; add or update tests before implementation when the change has behavioral impact.
- When updating the frontend, follow `frontend-ui-engineering` and `browser-testing-with-devtools`; verify the UI in a real browser with Chrome DevTools MCP or the active browser tooling.
- After frontend changes, run the scripted browser action test against the changed app: `BASE_URL=<frontend-url> k6 run load-tests/synthetic-browser-actions.js`. This test must continue to validate Faro button actions, cart flows, checkout, account save, and region/language mappings for US, Canada, China, UK, and Sweden.
- After every frontend deployment, run the same k6 browser-action validation against the deployed URL after the CloudFront invalidation or cache refresh completes: `BASE_URL=https://ensemble-grafana.com k6 run load-tests/synthetic-browser-actions.js`.
- After every frontend deployment, run `gcx` Faro user-action queries and produce a frontend user-action metrics report under `reports/frontend-user-actions/`. The report must include total user-action events, counts by action, counts by region/locale, Faro user-action durations when present, and whether required post-change actions are missing.
- After any k6 load test concludes, pull or preserve the latest run data under `reports/load-tests/`, run `node scripts/report-load-tests.mjs`, and include `reports/load-tests/load-test-comparison.md` plus the generated comparison charts in the work summary. Do this for passed, failed, and error runs when Grafana/k6 returns usable run metadata.
- Whenever `.env` `API_TEST_KEY` changes, patch `secret/ensemble-secrets` in namespace `ensemble-grafana`, restart `deployment/cart-service` and `deployment/account-service`, wait for both rollouts, verify the deployed secret hash matches `.env` without adding newline characters, then run the 30-second production regional smoke test: `TEST_DURATION=30s STOREFRONT_BASE_URL=https://ensemble-grafana.com API_BASE_URL=https://api.ensemble-grafana.com k6 run load-tests/grafana-cloud-20-user-regional.js`.
- For k6, Grafana, Terraform, and Kubernetes changes, include the validation command or the observed run/upload URL when available.
- When a required local dependency is missing, install it when feasible instead of stopping at instructions. Prefer repo-local or standard package-manager installation paths, then verify the tool works.
- After changing any repo-local skill or persona file under `skills/` or `agents/`, commit the change, push it to GitHub, and poll the resulting GitHub Actions run. Treat these guidance changes as operational policy updates, not local notes.
- After pushing to GitHub, poll the relevant GitHub Actions run with `gh run list`, `gh run watch`, and `gh run view --log-failed`. If CI fails, inspect the failing logs, fix the issue, run the matching local validation, commit, push, and repeat until the pushed commit has a passing CI run.
