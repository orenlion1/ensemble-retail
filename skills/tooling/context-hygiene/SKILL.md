---
name: context-hygiene
description: Use when investigating prompt-token growth, oversized tool outputs, unbounded conversation context, Codex session logs, or agent behavior that replays too much context. Provides concrete command hygiene and a repo-local audit script for finding the largest context contributors.
---

# Context Hygiene

Use this skill whenever a task mentions prompt growth, input tokens, context window pressure, oversized tool results, session logs, or repeated raw output in agent history.

## Operating Rules

- Prefer narrow reads over broad dumps. Use exact files, line ranges, `--json` field selection, `--limit`, `--page-size`, or query filters before increasing output size.
- Default exploratory shell calls to `max_output_tokens` at or below `6000`. Raise the cap only when the next decision requires the full result.
- Avoid broad recursive searches over `.codex/sessions`, `.codex/archived_sessions`, `node_modules`, generated reports, build directories, or vendored dependencies. If those paths are required, scope by date, filename suffix, or a precise pattern.
- Do not repeatedly inspect the same large raw output. Summarize the useful facts in a short note and continue from that summary.
- Use `rg --files` plus a second targeted read instead of `rg` over every file when the likely file location is unknown.
- For JSON, prefer `jq` field extraction or a small parser over returning full payloads.
- For Grafana, k6, and AI Observability queries, request only the fields needed for the current check and keep API limits low until a broader pull is justified.

## Audit Codex Session Context

Run the repo-local audit script against a Codex JSONL session log:

```sh
node scripts/audit-codex-token-context.mjs /Users/oren-lion/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl
```

Useful options:

```sh
node scripts/audit-codex-token-context.mjs <session-jsonl> --top 15 --warn-output-chars 20000 --warn-input-tokens 120000
node scripts/audit-codex-token-context.mjs <session-jsonl> --fail-on-warning
```

The report shows:

- First and latest per-call input/output tokens.
- Cached vs uncached input share.
- Cumulative input/output totals.
- Largest recorded tool outputs by character count and original tool token count.
- Largest serialized user, developer, and assistant messages.
- Warnings when a tool output or model call crosses configured thresholds.

## Remediation Pattern

When the audit finds oversized outputs:

1. Identify the command and line number that produced the large `function_call_output`.
2. Replace future uses with a narrower command: targeted file path, smaller `sed` range, lower `--limit`, selected JSON fields, or a tighter `rg` pattern.
3. Summarize the required facts in the agent response instead of re-emitting the raw output.
4. If the same investigation will repeat, add a purpose-built script that emits a compact report.
5. Mention in the work summary whether diagrams are unaffected. Context-hygiene changes do not alter architecture, traffic flow, telemetry flow, or operational dependencies unless they change a deployed workflow.

## Validation

- Run the audit script against the session that exposed the issue.
- Confirm the report identifies the top oversized outputs.
- Confirm no secrets are printed. The script reports sizes, line numbers, call IDs, and short previews only.
