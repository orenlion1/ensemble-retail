# Agent Skills and Automation

## Reconstructed Prompt Category

> Convert the project lessons into reusable agent skills, personas, slash commands, and CI gates so future prompts follow the same operating rules.

## Chronology

| Date | Evidence | Evolution |
| --- | --- | --- |
| 2026-05-30 | `3e74a9b` Add region localization skill | Storefront region work became a reusable skill. |
| 2026-05-30 | `4bd9007` Extend region skill with placeholder incidents | Region additions were tied to incident planning. |
| 2026-05-30 | `745151d` Add frontend skill checks to CI | Skill quality became part of CI. |
| 2026-05-30 | `8959f38` Add deployment gate to infrastructure skill | Infrastructure guidance gained deployment gating. |
| 2026-05-31 | `45efb0e` Require Grafana MCP dashboard validation | Dashboard changes required validation through available tooling. |
| 2026-05-31 | `c76bd07` Require GitHub push for skill and agent updates | Skill and persona changes became operational policy updates. |
| 2026-05-31 | `b4a9e29` Rename load test command alias | Operational commands were refined. |
| 2026-06-01 | `899353b` Add sync-slash-commands skill to mirror Codex and Cursor commands | Codex and Cursor command surfaces gained synchronization rules. |

## What This Category Produced

- Repo-local skills for infrastructure, observability, graphviz, coding, localization, dependencies, log investigation, incidents, and slash-command sync.
- Persona definitions for code review, security audit, and test engineering.
- CI checks that keep skill and command guidance from drifting.
- A rule that operational guidance changes must be committed, pushed, and validated in GitHub Actions.

## Current Artifacts

- [skills/README.md](../../../skills/README.md)
- [skills](../../../skills)
- [agents/README.md](../../../agents/README.md)
- [agents](../../../agents)
- [.codex/commands](../../../.codex/commands)
- [.cursor/commands](../../../.cursor/commands)
