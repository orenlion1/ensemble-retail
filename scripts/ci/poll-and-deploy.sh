#!/usr/bin/env bash
#
# poll-and-deploy.sh — the deterministic half of the CI → AWS autopilot.
#
# Implements the "Deployment Gate" from skills/infrastructure/SKILLS.md:
#   push to GitHub -> poll the Actions run for THIS commit -> on green, push to AWS.
#
# It does NOT fix failures itself. On a red run it prints the failing logs and
# exits non-zero so the calling agent (see the ci-deploy-autopilot skill, backed
# by the Codex `gh-fix-ci` skill) can fix, re-push, and re-invoke this script.
#
# AWS push = scripts/kubernetes/apply-manifests.sh (kubectl apply against EKS),
# always run against the exact commit whose CI passed.
#
# Usage:
#   scripts/ci/poll-and-deploy.sh [--sha <sha>] [--workflow Build] [--yes] [--no-deploy]
#
#   --sha <sha>     Commit to gate on (default: current HEAD).
#   --workflow      Workflow name to watch (default: Build, matches .github/workflows/build.yml).
#   --yes           Skip the interactive confirmation before the AWS deploy.
#   --no-deploy     Poll/report only; never run apply-manifests.sh (dry gate).
#   --timeout <s>   Max seconds to wait for the run to appear/finish (default: 1800).
#
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
sha=""
workflow="Build"
assume_yes=0
no_deploy=0
timeout_s=1800

while [[ $# -gt 0 ]]; do
  case "$1" in
    --sha) sha="$2"; shift 2 ;;
    --workflow) workflow="$2"; shift 2 ;;
    --yes) assume_yes=1; shift ;;
    --no-deploy) no_deploy=1; shift ;;
    --timeout) timeout_s="$2"; shift 2 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

command -v gh >/dev/null || { echo "ERROR: gh CLI not installed." >&2; exit 127; }
gh auth status >/dev/null 2>&1 || { echo "ERROR: gh not authenticated. Run 'gh auth login'." >&2; exit 1; }

[[ -n "$sha" ]] || sha="$(git -C "$root_dir" rev-parse HEAD)"
short_sha="${sha:0:7}"
echo "==> Gating commit $short_sha on workflow '$workflow'"

# 1) Find the run for this commit, waiting for it to appear if the push just happened.
run_id=""
deadline=$(( $(date +%s) + timeout_s ))
while :; do
  run_id="$(gh -R "$(gh repo view --json nameWithOwner -q .nameWithOwner)" run list \
    --workflow "$workflow" --commit "$sha" --limit 1 --json databaseId -q '.[0].databaseId' 2>/dev/null || true)"
  [[ -n "$run_id" && "$run_id" != "null" ]] && break
  (( $(date +%s) > deadline )) && { echo "ERROR: no '$workflow' run for $short_sha within ${timeout_s}s." >&2; exit 1; }
  echo "    waiting for a '$workflow' run on $short_sha ..."; sleep 10
done
echo "==> Watching run $run_id"

# 2) Block until the run finishes (gh run watch exits when complete).
gh run watch "$run_id" --exit-status >/dev/null 2>&1 && conclusion="success" || conclusion="failure"

# Authoritative conclusion straight from the API.
conclusion="$(gh run view "$run_id" --json conclusion -q .conclusion)"
run_url="$(gh run view "$run_id" --json url -q .url)"

if [[ "$conclusion" != "success" ]]; then
  echo "==> CI FAILED ($conclusion): $run_url"
  echo "----- failing logs -----"
  gh run view "$run_id" --log-failed || true
  echo "------------------------"
  echo "Fix the failure, re-push, and re-run this script. AWS deploy SKIPPED."
  exit 1
fi

echo "==> CI PASSED: $run_url"

if [[ "$no_deploy" -eq 1 ]]; then
  echo "==> --no-deploy set; gate is green but skipping AWS push."
  exit 0
fi

# 3) Deploy gate — the AWS push, only on green CI for this exact commit.
deployed_sha="$(git -C "$root_dir" rev-parse HEAD)"
if [[ "$deployed_sha" != "$sha" ]]; then
  echo "WARNING: working tree is at $deployed_sha but CI passed for $short_sha." >&2
  echo "         Checkout the passing commit before deploying (source of truth = passing commit)." >&2
  exit 1
fi

if [[ "$assume_yes" -ne 1 ]]; then
  read -r -p "Push commit $short_sha to AWS (kubectl apply against EKS)? [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] || { echo "Aborted by user."; exit 0; }
fi

echo "==> Pushing to AWS via scripts/kubernetes/apply-manifests.sh"
bash "$root_dir/scripts/kubernetes/apply-manifests.sh"
echo "==> AWS deploy complete for $short_sha ($run_url)"
