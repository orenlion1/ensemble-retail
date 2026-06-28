---
description: Run a chosen k6 load-test script non-interactively (Grafana Cloud by default).
argument-hint: "<spikes|spikes2|regional|browser|api|path> [--local] [--report] [-e KEY=VAL]"
allowed-tools: Bash
---

Thin wrapper around `scripts/load/run-load-test.sh` — it sources `.env` for secrets
(`API_TEST_KEY`, `K6_CLOUD_TOKEN`, base URLs) and runs `k6 cloud run <script>`.

Run, passing the args straight through:

```sh
bash scripts/load/run-load-test.sh $ARGUMENTS
```

- If `$ARGUMENTS` is empty, run `bash scripts/load/run-load-test.sh --list` and ask the user
  which script (aliases: `spikes`, `spikes2`, `regional`, `browser`, `api`).
- After a successful run, report the **Grafana Cloud k6 run URL** from the output.
- On `API_TEST_KEY is required` / missing-key errors, tell the user to set `API_TEST_KEY` in
  `.env` and rerun — do not hardcode secrets.

For the full workflow (Faro user-action validation, report + dashboard refresh), use the
`load-testing` skill instead; this command is just the runner.
