#!/usr/bin/env bash
set -euo pipefail

# Keep Codex (.codex/commands) and Cursor (.cursor/commands) slash commands in sync.
# Both tools read plain Markdown command files; this mirrors them so a command
# defined for one tool is available in the other.
#
# Usage:
#   sync-slash-commands.sh           Mirror both directories (newer file wins on conflict).
#   sync-slash-commands.sh --check   Report differences and exit non-zero; do not modify files.

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root_dir="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null || (cd "$script_dir/../../../.." && pwd))"
cd "$root_dir"

CODEX_DIR=".codex/commands"
CURSOR_DIR=".cursor/commands"

check_only=0
if [ "${1:-}" = "--check" ]; then
  check_only=1
fi

mkdir -p "$CODEX_DIR" "$CURSOR_DIR"

# Collect command basenames from both directories (portable; no GNU-only flags).
names="$(
  for d in "$CODEX_DIR" "$CURSOR_DIR"; do
    [ -d "$d" ] || continue
    for f in "$d"/*.md; do
      [ -e "$f" ] && basename "$f"
    done
  done | sort -u
)" || true

changed=0
out_of_sync=0

while IFS= read -r name; do
  [ -n "$name" ] || continue
  codex_file="$CODEX_DIR/$name"
  cursor_file="$CURSOR_DIR/$name"

  if [ -f "$codex_file" ] && [ -f "$cursor_file" ]; then
    if cmp -s "$codex_file" "$cursor_file"; then
      continue
    fi
    if [ "$check_only" -eq 1 ]; then
      echo "OUT OF SYNC: $name"
      out_of_sync=$((out_of_sync + 1))
      continue
    fi
    if [ "$codex_file" -nt "$cursor_file" ]; then
      cp "$codex_file" "$cursor_file"
      echo "SYNCED codex -> cursor: $name"
    else
      cp "$cursor_file" "$codex_file"
      echo "SYNCED cursor -> codex: $name"
    fi
    changed=$((changed + 1))
  elif [ -f "$codex_file" ]; then
    if [ "$check_only" -eq 1 ]; then
      echo "MISSING in cursor: $name"
      out_of_sync=$((out_of_sync + 1))
      continue
    fi
    cp "$codex_file" "$cursor_file"
    echo "ADDED to cursor: $name"
    changed=$((changed + 1))
  else
    if [ "$check_only" -eq 1 ]; then
      echo "MISSING in codex: $name"
      out_of_sync=$((out_of_sync + 1))
      continue
    fi
    cp "$cursor_file" "$codex_file"
    echo "ADDED to codex: $name"
    changed=$((changed + 1))
  fi
done <<EOF
$names
EOF

if [ "$check_only" -eq 1 ]; then
  if [ "$out_of_sync" -gt 0 ]; then
    echo "$out_of_sync command file(s) out of sync. Run: skills/tooling/sync-slash-commands/scripts/sync-slash-commands.sh"
    exit 1
  fi
  echo "Codex and Cursor slash commands are in sync."
  exit 0
fi

echo "Sync complete. $changed file(s) updated."
