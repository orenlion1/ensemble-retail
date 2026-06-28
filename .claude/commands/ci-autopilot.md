---
description: Drive the CI → fix → AWS-deploy loop, using Claude as the fix engine.
argument-hint: "[--sha <sha>] [--yes] [--no-deploy]"
allowed-tools: Bash, Read, Edit, Write, Grep, Glob
---

You are the **fix engine** for the Ensemble CI → AWS deploy autopilot. The deterministic
parts (poll CI, gated AWS deploy) live in `scripts/ci/poll-and-deploy.sh`; YOUR job is the
part a script can't do — author code fixes when CI is red — then re-push and re-invoke the
script until it goes green and deploys.

Policy of record: the **Deployment Gate** in `skills/infrastructure/SKILLS.md`. Authoritative
loop + pieces: `skills/infrastructure/ci-deploy-autopilot/SKILL.md`.

## Loop

1. **Confirm the pushed commit.** `git rev-parse HEAD`; ensure it's pushed (`git status -sb`).
   If there are un-pushed local commits, push them first (`git push`). Never deploy a commit
   that isn't on the remote.
2. **Run the gate:** `bash scripts/ci/poll-and-deploy.sh $ARGUMENTS`
   - It finds & watches the `Build` run for HEAD (or `--sha`).
3. **If it exits 0 (green):** the script already ran the gated AWS deploy (or skipped it for
   `--no-deploy`). Report the run URL and stop. Done.
4. **If it exits non-zero (red):** the script printed the failing logs. Now fix it:
   - Read the failing-log snippet; identify the failing job (`security` / `backend:<svc>` /
     `frontend` / `observability`) and the root cause. Follow the `gh-fix-ci` approach — if
     logs are truncated, pull them directly with `gh run view <id> --log-failed`.
   - Make the **smallest correct fix** (one logical change; follow
     `skills/infrastructure/SKILLS.md` + conventional-commit discipline). Do NOT disable the
     check, skip the test, or weaken the gate to make CI pass.
   - **Reproduce locally first** (mirror `.github/workflows/build.yml`) before pushing, so you
     don't burn a CI cycle:
     - `bash scripts/security/predeploy-check.sh`
     - backend: `( cd services/<svc> && mvn -B -ntp package -DskipTests )`
     - frontend: `( cd frontend && npm ci && npm run build && npm run test:e2e )`
     - observability: `node observability/synthetic-monitoring/sync-scripted-check.mjs --check`
   - Commit (`fix: <what/why>`) and push.
   - **Go back to step 2** with the new HEAD sha. Repeat until green.

## Stop conditions (do not loop forever)

- **Stop and ask** after **3** failed fix attempts on the same job, or if the same error
  recurs unchanged after a fix — summarize what you tried and the current failing log.
- **Stop and ask** if the fix would require editing CI config to relax a gate, touching
  secrets, or changing infra/deploy manifests in a way that wasn't the user's intent.
- **Never** force-push to `main`, and never pass `--yes` to the deploy unless the user
  included it in `$ARGUMENTS`.

## Start now

Run step 1, then `bash scripts/ci/poll-and-deploy.sh $ARGUMENTS`, and work the loop. Give a
one-line status before each gate run (e.g. "Gate attempt 2 on a1b2c3d after fixing the
cart-service test").
