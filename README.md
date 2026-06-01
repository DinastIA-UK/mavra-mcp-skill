# Mavra MCP Skill

An installable [Agent Skill](https://agentskills.io) that teaches your AI client
(Claude Code, Claude Desktop, Cursor, …) how to manage your **Mavra** account —
AI agents, CRM, kanbans, channels, webhooks, contacts, sessions, and messages —
through the Mavra MCP server.

## Install

### Claude Code (recommended: global, available in every project)

```bash
npx skills add DinastIA-UK/mavra-mcp-skill -g -a claude-code --copy
```

Then **restart Claude Code** and trigger it with `/mavra` (or just ask to "manage my
Mavra account").

- `-a claude-code` targets Claude Code explicitly. Without it, the interactive picker
  may install to `.agents/skills/`, which **Claude Code does not read** — only
  `.claude/skills/` (project) and `~/.claude/skills/` (global) are loaded.
- `-g` installs globally (`~/.claude/skills/`) so it works in every project. Drop `-g`
  to install into the current project only (`./.claude/skills/`); then open that project
  in Claude Code.
- `--copy` copies the files instead of symlinking (more reliable across clients).
- A newly added skill requires a **Claude Code restart** to appear.

### Other clients

```bash
npx skills add DinastIA-UK/mavra-mcp-skill -a <your-client>
```

The `skills` CLI supports many agents (Cursor, Cline, Codex, …). Pick yours with `-a`,
or run without `-a` to choose interactively.

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
