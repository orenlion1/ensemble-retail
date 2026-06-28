# ensemble — agent guidance

## Grafana / gcx
- **Stay on the orenlion (ensemble) stack only.** This repo targets the `orenlion` Grafana stack
  (`https://orenlion.grafana.net`). The live gcx config (`~/.config/gcx/config.yaml`) exposes it
  as the `default` context — that is the ensemble stack, so the default context is correct here.
  Do **not** add or switch to `teletracking` / `teletracking-eu` contexts from this repo.
- **Do not read `gcx-config.txt`.** It is a sanitized template — every token is the literal
  placeholder `**REDACTED**`, so it carries no usable credentials and no useful config. It also
  lists `ensemble`/`teletracking` contexts that do NOT exist in the live config; ignore it. The
  real, working credentials live in `gcx`'s own config; validate connectivity with `gcx` directly
  (e.g. `gcx api /api/user`, `gcx datasources list`).

## Connectivity validation
- AWS: `aws sts get-caller-identity` (account `629513454417`, user `ensemble-grafana`, `us-east-1`).
- Grafana: `gcx api /api/user` against the `ensemble` context.
- GitHub: `ssh -T git@github.com`.
