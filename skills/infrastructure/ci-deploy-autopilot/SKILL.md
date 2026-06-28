---
name: ci-deploy-autopilot
description: Push to GitHub, poll the Build workflow for the pushed commit, fix failures and re-push until CI is green, then push to AWS (EKS) for that exact commit. Use when the user wants an end-to-end "commit → CI → fix → deploy" loop for the Ensemble repo.
---

# CI → Fix → AWS Deploy Autopilot

Automates the **Deployment Gate** defined in [`skills/infrastructure/SKILLS.md`](../SKILLS.md):
publish the exact revision to GitHub, verify CI on that revision, and **push to AWS only
after the deployed commit's GitHub Actions run passes**. The passing git commit is the
source of truth for the AWS deploy.

## Pieces

| Step | Mechanism |
|---|---|
| Commit + push | `git` / Codex `yeet` skill (stage, commit, push, optional PR) |
| Poll CI for the commit | `scripts/ci/poll-and-deploy.sh` (wraps `gh run watch`) |
| Inspect & fix failures | Codex `gh-fix-ci` skill (`inspect_pr_checks.py`) + `git-workflow-and-versioning` discipline |
| Push to AWS on green | `scripts/kubernetes/apply-manifests.sh` (kubectl apply → EKS), invoked by `poll-and-deploy.sh` |

There is **no AWS deploy skill** in `~/.codex` (only Cloudflare/Netlify/Render/Vercel) — the
AWS push is this repo's own `apply-manifests.sh`.

## Loop

```
commit + push to main
        │
        ▼
scripts/ci/poll-and-deploy.sh --sha <pushed-sha>
        │
        ├── CI red ──► print --log-failed ──► agent fixes locally
        │                                         (gh-fix-ci pattern)
        │                                     ──► run local validation
        │                                     ──► commit + push fix
        │                                     ──► re-run poll-and-deploy.sh   ⟲
        │
        └── CI green ──► confirm ──► apply-manifests.sh (push to AWS/EKS) ──► done
```

## Run it

```bash
# After pushing your commit to GitHub:
scripts/ci/poll-and-deploy.sh                 # gate HEAD on the Build workflow, then deploy
scripts/ci/poll-and-deploy.sh --no-deploy     # poll/report only (no AWS push)
scripts/ci/poll-and-deploy.sh --yes           # skip the pre-deploy confirmation
scripts/ci/poll-and-deploy.sh --sha <sha>     # gate a specific commit
```

On a red run the script prints the failing logs and exits non-zero — fix, re-push, re-run.

## Local validation before each push (avoid burning CI cycles)

Mirror the `Build` workflow locally first (`.github/workflows/build.yml`):

```bash
bash scripts/security/predeploy-check.sh                       # security gate
( cd services/<svc> && mvn -B -ntp package -DskipTests )       # backend
( cd frontend && npm ci && npm run build && npm run test:e2e ) # frontend + Playwright
node observability/synthetic-monitoring/sync-scripted-check.mjs --check
```

## Autonomy & safety

- **Default: gated.** Fixes go through normal commits; the AWS push asks for confirmation
  unless `--yes`. This matches trunk-based dev + branch protection (no force-push to main).
- **Prereqs:** `gh auth status` (repo + workflow scopes), `kubectl` context pointed at the
  EKS cluster (`aws eks update-kubeconfig`), AWS creds (`aws sts get-caller-identity`).
- **Emergency deploys** before CI passes must follow the SKILLS.md exception rule: document
  the failed-run URL, risk, and rollback plan first.
- The script refuses to deploy if the working tree HEAD differs from the gated commit, so
  AWS always receives the revision that actually passed CI.
