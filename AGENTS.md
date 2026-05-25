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
| IRM incidents and labels | `skills/observability/incident-creation/SKILL.md` |
| Frontend and Spring Boot services | `skills/coding/SKILLS.md` |
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
| App or API behavior | `skills/coding/SKILLS.md` + `test-driven-development` | `code-reviewer` |
| Tooling setup | `skills/dependencies/SKILLS.md` | — |
| Frontend UI change | `skills/coding/SKILLS.md` + `frontend-ui-engineering` + `browser-testing-with-devtools` | `test-engineer` |
| Large cross-cutting PR | repo skills as needed | parallel: `code-reviewer`, `security-auditor`, `test-engineer` |

## Required Documentation Updates

- Update `README.md` for every infrastructure or observability change, including Terraform stacks, Kubernetes manifests, CloudFront/API routing, Grafana Cloud, Faro, Alloy, Beyla, Pyroscope, Synthetic Monitoring, k6, alerting, incidents, secrets, certificates, DNS, WAF, and deployment commands.
- Document reusable `gcx` permission dependencies in `skills/observability/SKILLS.md`. Keep `README.md` focused on this deployment's concrete token locations, current auth blockers, stack URLs, command examples, and observed resource IDs.
- Update `DIAGRAMS.md` whenever a change affects architecture, request flow, network boundaries, telemetry flow, data stores, identity/auth, CI/load testing, or operational dependencies.
- Whenever `DIAGRAMS.md` changes, regenerate the Mermaid source extracts and PNG exports in `docs/diagrams/` so the rendered files stay in sync with the authoritative diagrams.
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
- After frontend changes, run the scripted browser action test against the changed app: `BASE_URL=<frontend-url> k6 run load-tests/synthetic-browser-actions.js`. This test must continue to validate Faro button actions, cart flows, checkout, account save, and region/language mappings for US, Canada, China, and UK.
- For k6, Grafana, Terraform, and Kubernetes changes, include the validation command or the observed run/upload URL when available.
