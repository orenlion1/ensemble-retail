---
name: sync-slash-commands
description: Keep Codex (.codex/commands) and Cursor (.cursor/commands) slash commands in sync so a command defined for one tool is available in the other. Use whenever creating, editing, renaming, or deleting a slash command, when the user adds a `/command`, or when asked to sync, mirror, or reconcile Codex and Cursor commands.
---

# Sync Slash Commands

Codex and Cursor both read plain Markdown slash-command files. Codex reads `.codex/commands/*.md`; Cursor reads `.cursor/commands/*.md`. The file basename (without `.md`) is the command name (e.g. `run-load-test.md` -> `/run-load-test`). The two directories must stay mirrored so every command works in both tools.

## When to run

Run the sync after any change to a command file in either directory:

- Creating a new `/command`.
- Editing or renaming an existing command.
- Deleting a command (delete it in both directories first, then sync).

## Sync now

From the repo root:

```sh
skills/tooling/sync-slash-commands/scripts/sync-slash-commands.sh
```

Behavior:

- Files present in only one directory are copied to the other.
- Files present in both but differing: the newer file (by mtime) is copied over the older.
- Identical files are left untouched.

## Verify parity

Use `--check` for a read-only parity check (no copying). It exits non-zero when the two directories differ, so it can gate CI or a pre-push step:

```sh
skills/tooling/sync-slash-commands/scripts/sync-slash-commands.sh --check
```

## Authoring notes

- Keep command content tool-agnostic so the same file works in Codex and Cursor. Both render the leading `# /command-name` heading and Markdown body.
- The command name comes from the filename. To rename a command, rename the file in both directories, then run the sync.
- Deletions are not propagated automatically. Remove the file from both directories, then run `--check` to confirm parity.

## After changing commands or this skill

After editing command files or this skill, follow `AGENTS.md`: commit, push, and poll the GitHub Actions run until green.

```sh
git add .codex/commands .cursor/commands skills/tooling/sync-slash-commands
git commit -m "Sync Codex and Cursor slash commands"
git push
gh run list --branch main --limit 5
gh run watch <run-id> --exit-status
```
