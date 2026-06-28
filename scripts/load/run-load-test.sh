#!/usr/bin/env bash
# run-load-test.sh — thin non-interactive k6 load-test runner (Grafana Cloud by default).
#
# Mirrors the load-testing skill's run step: sources gitignored .env for secrets
# (API_TEST_KEY, K6_CLOUD_TOKEN, base URLs) and runs `k6 cloud run <script>`.
#
# Usage:
#   run-load-test.sh <script|alias> [--local] [--report] [-e KEY=VAL ...]
#
#   aliases:  spikes (traffic-spikes) | spikes2 | regional | browser | api
#   --local   run with `k6 run` (local) instead of `k6 cloud run`
#   --report  after the run, refresh comparison artifacts (node scripts/report-load-tests.mjs)
#   --list    list available scripts and exit
#   -e K=V    extra env passed through to k6 (repeatable)
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ld="$root_dir/load-tests"
env_file="$root_dir/.env"
mode="cloud"; report=0; target=""
extra=()

resolve() {
  case "$1" in
    spikes)   echo "$ld/grafana-cloud-traffic-spikes.js" ;;
    spikes2)  echo "$ld/grafana-cloud-traffic-spikes-2.js" ;;
    regional) echo "$ld/grafana-cloud-20-user-regional.js" ;;
    browser)  echo "$ld/synthetic-browser-actions.js" ;;
    api)      echo "$ld/ensemble-retail.js" ;;
    *) if [ -f "$1" ]; then echo "$1"; elif [ -f "$ld/$1" ]; then echo "$ld/$1"; else echo ""; fi ;;
  esac
}

while [ $# -gt 0 ]; do
  case "$1" in
    --local) mode="local"; shift ;;
    --report) report=1; shift ;;
    --list) ls "$ld"/*.js; exit 0 ;;
    -e) extra+=( -e "$2" ); shift 2 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) target="$1"; shift ;;
  esac
done

if [ -z "$target" ]; then
  echo "Usage: run-load-test.sh <script|alias> [--local] [--report] [-e KEY=VAL]" >&2
  echo "aliases: spikes spikes2 regional browser api" >&2
  exit 2
fi
script="$(resolve "$target")"
if [ -z "$script" ] || [ ! -f "$script" ]; then echo "ERROR: no such script/alias: $target" >&2; exit 1; fi
command -v k6 >/dev/null || { echo "ERROR: k6 not installed (brew install k6)." >&2; exit 127; }

# Secrets from gitignored .env (API_TEST_KEY, K6_CLOUD_TOKEN, optional base URLs).
if [ -f "$env_file" ]; then set -a; . "$env_file"; set +a; else echo "WARN: no .env at $env_file" >&2; fi
case "${API_TEST_KEY:-}" in
  ""|replace-with*) echo "ERROR: API_TEST_KEY missing/placeholder in .env — set it and retry." >&2; exit 1 ;;
esac

k6args=( -e API_TEST_KEY="$API_TEST_KEY" )
[ -n "${STOREFRONT_BASE_URL:-}" ] && k6args+=( -e STOREFRONT_BASE_URL="$STOREFRONT_BASE_URL" )
[ -n "${API_BASE_URL:-}" ] && k6args+=( -e API_BASE_URL="$API_BASE_URL" )
if [ "${#extra[@]}" -gt 0 ]; then k6args+=( "${extra[@]}" ); fi

if [ "$mode" = "cloud" ]; then
  [ -n "${K6_CLOUD_TOKEN:-}" ] || echo "WARN: K6_CLOUD_TOKEN not set; 'k6 cloud run' may not authenticate." >&2
  echo "==> k6 cloud run $(basename "$script")"
  k6 cloud run "${k6args[@]}" "$script"
else
  echo "==> k6 run (local) $(basename "$script")"
  k6 run "${k6args[@]}" "$script"
fi

if [ "$report" -eq 1 ]; then
  echo "==> refreshing load-test comparison artifacts"
  ( cd "$root_dir" && node scripts/report-load-tests.mjs )
fi
