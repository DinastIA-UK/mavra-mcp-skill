# Mavra MCP Skill

An installable [Agent Skill](https://agentskills.io) that teaches your AI client
(Claude Code, Claude Desktop, Cursor, …) how to manage your **Mavra** account —
AI agents, CRM, kanbans, channels, webhooks, contacts, sessions, and messages —
through the Mavra MCP server.

## Install

Run this **from your project's root** to install the skill into that project
(`./.claude/skills/mavra`):

```bash
npx github:DinastIA-UK/mavra-mcp-skill
```

Or install it **globally** (available in every project, `~/.claude/skills/mavra`):

```bash
npx github:DinastIA-UK/mavra-mcp-skill --global
```

Then **restart Claude Code** and trigger it with `/mavra` (or just ask to "manage my
Mavra account").

> This uses the repo's own installer, which copies the skill into the directory Claude
> Code actually reads (`.claude/skills/`). It runs on macOS, Windows, and Linux via
> `npx` (Node only — no extra tooling).

### Alternative: the `skills` CLI

The community [`skills`](https://github.com/vercel-labs/skills) CLI also works, but be
explicit about the target or it may install to `.agents/skills/` (which Claude Code does
not read):

```bash
npx skills add DinastIA-UK/mavra-mcp-skill -a claude-code --copy        # this project
npx skills add DinastIA-UK/mavra-mcp-skill -a claude-code --copy -g     # global
```

## Updating

Re-run the install command — the installer **removes the old skill folder and copies
the latest**, so updates are a clean sync (no stale files). Then **restart your client**.

Because `npx` caches packages, force the newest version from GitHub:

```bash
npx --yes github:DinastIA-UK/mavra-mcp-skill@latest            # this project
npx --yes github:DinastIA-UK/mavra-mcp-skill@latest --global   # all projects
```

The install output prints the version it just installed (e.g. `✓ Installed the Mavra
skill v1.0.0 …`) so you can confirm the update took.

> Tip: the skill's tool reference (`references/`) is a snapshot of the Mavra MCP server.
> When the server adds tools (e.g. WhatsApp management), update the skill to get the new
> docs.

## What it does

- **Connects** your client to the Mavra MCP server (`scripts/connect.mjs`, a
  cross-platform Node script — macOS/Windows/Linux; prod by default, `--dev` for the
  dev environment).
- **Teaches** the login flow and the consolidated `manage_*` tools, with end-to-end
  recipes.
- **References** every tool action with typed request fields and response payloads
  (`skills/mavra/references/tools.md`).

## Manual connection (non-Claude clients)

Add a remote/HTTP MCP server pointing at:

- Production: `https://api.maiacompany.io/mcp`
- Development: `https://dev.api.maiacompany.io/mcp`

## Keeping in sync

The typed tool reference (`skills/mavra/references/tools.md`) mirrors the Mavra MCP
server's tools. When the server's tools change, regenerate this reference from the
server's `tools/list` output and the tool source.
