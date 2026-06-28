# Agent Personas

Specialist personas for Ensemble-Retail. Each file is a role with a single perspective and output format. The user (or main agent) orchestrates them; personas do not invoke other personas.

| Persona | File | Best for |
|---------|------|----------|
| `code-reviewer` | [code-reviewer.md](code-reviewer.md) | Five-axis pre-merge review |
| `security-auditor` | [security-auditor.md](security-auditor.md) | Security audit report (auth, secrets, exposure) |
| `test-engineer` | [test-engineer.md](test-engineer.md) | Test strategy, coverage gaps, Prove-It tests |

Orchestration and intent routing: `AGENTS.md`.

**Cursor:** `security-auditor` is always loaded via `.cursor/rules/security-auditor.mdc` (`alwaysApply: true`). Canonical persona text lives in `agents/security-auditor.md` — update both when changing the persona.

Based on [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) personas, tailored for this repo's `skills/` playbooks.
