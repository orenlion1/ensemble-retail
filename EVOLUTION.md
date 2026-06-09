# Ensemble-Grafana Evolution

This file summarizes how Ensemble-Grafana evolved from the initial promptable training repository into the latest operational state in this repo.

The repository does not contain a literal transcript of every user prompt. This chronology is reconstructed from auditable project evidence: git commit subjects, dated reports, README and runbook updates, Graphviz assets, load-test history, policy and skill changes, and operational artifacts committed through June 9, 2026.

## At A Glance

![Ensemble-Grafana evolution timeline](docs/evolution/diagrams/ensemble-evolution-timeline.png)

- Full evolution package: [docs/evolution/README.md](docs/evolution/README.md)
- High-resolution PNG: [docs/evolution/diagrams/ensemble-evolution-timeline.png](docs/evolution/diagrams/ensemble-evolution-timeline.png)
- SVG source export: [docs/evolution/diagrams/ensemble-evolution-timeline.svg](docs/evolution/diagrams/ensemble-evolution-timeline.svg)
- Graphviz DOT source: [docs/evolution/diagrams/ensemble-evolution-timeline.dot](docs/evolution/diagrams/ensemble-evolution-timeline.dot)

## Prompt Categories

The evolution is easiest to read as a set of prompt categories. Each category links to a deeper timeline with representative prompts, source-backed milestones, and the artifacts that prove the work happened.

| Category | Evolution file | What changed |
| --- | --- | --- |
| Product seed and framing | [product-seed.md](docs/evolution/categories/product-seed.md) | The repo became a promptable ecommerce training platform with a live mock storefront. |
| Application and storefront | [application-storefront.md](docs/evolution/categories/application-storefront.md) | The frontend, checkout, account, localization, and browser regression surfaces matured. |
| Infrastructure and deployment | [infrastructure-deployment.md](docs/evolution/categories/infrastructure-deployment.md) | Terraform, AWS, EKS, Kubernetes rollout rules, secrets, WAF, and deployment docs formed the operating base. |
| Observability and telemetry | [observability-telemetry.md](docs/evolution/categories/observability-telemetry.md) | Grafana Cloud, Faro, Alloy, Beyla, dashboards, user-action reporting, and telemetry validation became core project behavior. |
| Load testing and resilience | [load-testing-resilience.md](docs/evolution/categories/load-testing-resilience.md) | k6 API and browser load tests evolved into repeatable traffic-spike exercises and comparison reporting. |
| Incidents and operations | [incidents-operations.md](docs/evolution/categories/incidents-operations.md) | IRM incidents, RCA reports, on-call setup, kubelet investigations, and operational reports were added. |
| Diagrams and communication | [diagrams-communication.md](docs/evolution/categories/diagrams-communication.md) | Graphviz diagrams, dashboard inventory, and presentation-ready visual assets made the system easier to explain. |
| Agent skills and automation | [agent-skills-automation.md](docs/evolution/categories/agent-skills-automation.md) | Repo-local skills, personas, slash-command sync, and CI checks turned lessons into reusable operating policy. |

## Chronology

### May 24-25, 2026: Seed the Platform

The project started as a promptable training repo and quickly gained its durable frame: an outdoor-inspired ecommerce storefront, three Spring Boot services, AWS deployment assets, and Grafana observability configuration.

Representative prompt category:

> Build a promptable ecommerce training application that can demonstrate frontend, API, deployment, and observability workflows end to end.

Key evidence:

- `7ba5307` and `39b5092`: initial repository and ecommerce observability platform commits.
- `33e5f67`: README explicitly documented the repo as a promptable training exercise.
- `8fdb77d`: CI moved to Node 22 for frontend builds.
- `c801411`: README invited readers to try the live mock storefront.

### May 27-29, 2026: Connect Dashboards, Guards, and Regression Paths

The repo moved from a static application toward operational validation. Grafana dashboard artifacts appeared, account baseline controls were guarded, k6 browser actions were added, and Playwright storefront regression tests entered the workflow.

Representative prompt categories:

> Save and manage the Grafana dashboard assets.

> Make frontend and API behavior testable with browser and k6 validation.

> Move sensitive infrastructure controls into a guarded baseline stack.

Key evidence:

- `bac6d52`: saved Grafana dashboard artifact.
- `0503f1c`: k6 load tests began covering Faro browser actions.
- `cd5a7df`: SSM account controls moved into a guarded baseline stack.
- `0e7f845`: Playwright storefront regression tests were added.
- `857e906`: frontend deploys required k6 browser validation.

### May 30, 2026: Operational Build-Out Day

May 30 was the largest single-day expansion. The project added stronger AWS and Grafana wiring, checkout polish, Sweden localization, region-localization skills, Graphviz traffic-spike diagrams, incident artifacts, frontend validation reports, and multiple k6 traffic-spike tuning passes.

Representative prompt categories:

> Add another storefront region and make sure observability, tests, and docs follow it.

> Visualize traffic-spike behavior with Graphviz and publish the diagrams.

> Tune the traffic-spike load test until the run data is useful and documented.

Key evidence:

- `6d163c0` and `7a0857e`: RDS CloudWatch scrape job and Grafana CloudWatch discovery tags.
- `bb32405`: Sweden storefront localization.
- `3e74a9b` and `4bd9007`: region localization skill and placeholder incident guidance.
- `bf69040`, `3c8201b`, and `49eb585`: Graphviz traffic-spike diagrams and updates.
- `62cadf0`: passing traffic-spike load-test report recorded.

### May 31, 2026: Make Operations Repeatable

The repo hardened the operational model: dashboard inventory rules, Grafana MCP validation, GitHub push requirements for skill changes, kubelet log investigation reports, IRM on-call docs, dashboard color standardization, inventory scaling, and passing 40 rps traffic-spike evidence.

Representative prompt categories:

> Turn dashboard and incident work into repeatable operating practice.

> Investigate kubelet errors and compare the local plan with Grafana Assistant.

> Stabilize services and storefront layout under load and browser checks.

Key evidence:

- `f8d67aa`: Grafana diagram dashboard inventory.
- `45efb0e`: Grafana MCP dashboard validation requirement.
- `c76bd07`: GitHub push required for skill and agent updates.
- `16ddb4b` and `f0f85c7`: kubelet investigation reports.
- `9ddee30`: SRE IRM on-call setup.
- `c99e3b4`: passing 40 rps traffic-spike run recorded.
- `247db68` and `5fce55e`: hero headline clipping fix and regression stabilization.

### June 1-2, 2026: Generate, Sync, and Raise Baselines

The project shifted from one-off testing to generated manifests and repeatable reporting. The k6 scripted check manifest came from one source, slash commands were synchronized between Codex and Cursor, load-test reports were refreshed across multiple runs, the traffic-spike target moved to 120 rps, and a Black Friday cart-add incident was recorded.

Representative prompt categories:

> Generate validation manifests from a single k6 source.

> Keep Codex and Cursor operational commands synchronized.

> Raise the traffic-spike baseline and document the outcome.

Key evidence:

- `0cfc1bd`: generated scripted check manifest from one k6 source.
- `899353b`: sync-slash-commands skill added.
- `6daf6d7`: traffic-spike load raised to 120 rps.
- `f80bced`: Black Friday cart-add incident recorded.
- `c35442f`: load-test docs aligned with the 120 rps baseline.

### June 3-8, 2026: Latest Load-Test Evidence and Evolution Publishing

The latest visible evolution is continued load-test reporting plus the first committed evolution package. New run artifacts were committed on June 3, June 4, and June 8, preserving the current Grafana/k6 evidence trail. The project also gained a dedicated evolution narrative, category files, and a high-resolution Graphviz timeline so people can understand how Ensemble-Grafana was built end to end.

Representative prompt categories:

> Preserve the latest k6/Grafana run data and keep comparison reports current.

> Explain how Ensemble-Grafana was built from first prompt to current state, with category files and a Graphviz timeline.

Key evidence:

- `d8d320c`: load-test report for run `7673849`.
- `bdc102d`: load-test report for run `7683642`.
- `b5273e4`: load-test report for run `7716954`.
- `a44cebe`: evolution docs, category files, DOT source, SVG export, and high-resolution PNG timeline were added.
- `60de963`: load-test report for run `7718235`, the latest load-test evidence in this reconstructed chronology.

### June 9, 2026: Make Evolution Tracking a Policy

The project added explicit agent guidance so future key changes update the evolution story instead of letting the chronology drift. This turns `EVOLUTION.md` from a one-time retrospective into a maintained project artifact.

Representative prompt category:

> Keep the evolution history current whenever key project, policy, skill, diagram, CI, load-test, or operational milestones land.

Key evidence:

- `AGENTS.md`: required documentation rules now call out `EVOLUTION.md`, matching category files, and evolution timeline regeneration.
- `skills/graphviz/SKILL.md`: Graphviz workflow now includes evolution-history diagrams and the `docs/evolution/diagrams/` DOT/SVG/high-resolution PNG export set.
- `docs/evolution/categories/agent-skills-automation.md`: agent policy and skill guidance now records evolution tracking as part of the repo operating model.

## End-to-End Shape

The project now reads as an end-to-end operational application:

1. A Vite storefront creates real user journeys: browsing, cart, checkout, account, region, and language actions.
2. Spring Boot services own inventory, cart, and account data boundaries.
3. Terraform and Kubernetes define AWS, EKS, edge, auth, data, workload, and rollout behavior.
4. Grafana Cloud, Faro, Alloy, Beyla, dashboards, IRM, and reports observe the system.
5. k6 and Playwright validate both protocol and browser behavior.
6. Graphviz diagrams and dashboard panels explain request paths, telemetry paths, load models, and now project evolution.
7. `EVOLUTION.md` and `docs/evolution/categories/` preserve the build chronology by prompt category.
8. Repo-local skills, personas, and `AGENTS.md` preserve the working rules so future prompts can reproduce the same quality bar.

## Verification Notes

- The evolution diagram is documentation-only and does not change architecture, request flow, telemetry flow, network boundaries, or operational dependencies. `DIAGRAMS.md` was not updated because the existing system diagrams still match the live system.
- The high-resolution image was generated from Graphviz DOT and committed with the DOT and SVG sources under `docs/evolution/diagrams/`.
