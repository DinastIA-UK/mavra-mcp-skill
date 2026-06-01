# Mavra MCP Skill

An installable [Agent Skill](https://agentskills.io) that teaches your AI client
(Claude Code, Claude Desktop, Cursor, …) how to manage your **Mavra** account —
AI agents, CRM, kanbans, channels, webhooks, contacts, sessions, and messages —
through the Mavra MCP server.

## Install

```bash
npx skills add DinastIA-UK/mavra-mcp-skill
```

This installs the `mavra` skill into your client's skills directory. In Claude Code,
trigger it with `/mavra` or just ask to "manage my Mavra account".

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
