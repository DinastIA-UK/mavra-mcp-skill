---
name: mavra
description: >-
  Use when the user wants to manage their Mavra account through an AI client —
  creating or editing AI agents, tools, kanbans, CRM records, channels, webhooks,
  contacts, sessions, or messages via the Mavra MCP server. Triggers: "Mavra",
  "my CRM", "my agents", "manage my pipeline", connecting the Mavra MCP server.
metadata:
  author: mavra
  version: "1.0.0"
---

# Managing Mavra via MCP

Mavra is a CRM + AI-agent platform. This skill lets you manage a Mavra account by
chatting with your AI client, through the Mavra MCP server.

## 1. Connect (once)

Register the Mavra MCP server in this client by running the bundled script with Node
(works on macOS, Windows, and Linux):

```bash
node "${CLAUDE_SKILL_DIR}/scripts/connect.mjs"        # production
node "${CLAUDE_SKILL_DIR}/scripts/connect.mjs" --dev  # development
```

`${CLAUDE_SKILL_DIR}` is set by Claude Code. In other clients, run the
`scripts/connect.mjs` file from this skill's folder with `node`, or add a remote (HTTP)
MCP server pointing at `https://api.maiacompany.io/mcp` (or
`https://dev.api.maiacompany.io/mcp`).

## 2. Log in

Call the **`login`** tool with the user's email and password. It returns several
tokens. **Use the `idToken` (NOT the accessToken) as the `authToken` argument on every
other tool call.**

If any tool returns a 401, call **`refresh`** with the `refreshToken` to get a new
`idToken`, then retry.

## 3. Recipes

Each recipe shows the exact arguments to pass. Replace `IDTOKEN` with the `idToken` from
`login`. For the full list of tools, actions, typed request fields, and response shapes,
read `references/tools.md`.

### Create an AI agent

```json
{ "action": "create", "authToken": "IDTOKEN",
  "title": "Sales Assistant",
  "customPrompt": "You are a helpful sales assistant.",
  "contextSize": 4000 }
```

Call `manage_agents` with the above. **`contextSize` must be between 800 and 128000.**
The response includes the new agent's `id` (use it for `get` / `update` / `delete`). To
turn on guardrails later, call `manage_agents` `action: "update"` with `agentId` plus
`guardrailsEnabled: true`.

### Add and find a CRM record

Create with `manage_crm_records` `action: "create"` (`title` required):

```json
{ "action": "create", "authToken": "IDTOKEN", "title": "Acme Corp" }
```

The response returns **`recordId`** — use it for later `get` / `update` / `delete`. To
search, call `search_crm` `action: "search"` with `q: "acme"`.

### List sessions and transfer one

`manage_sessions` `action: "list"` returns `{ items: [...] }`. To move a conversation to
another agent:

```json
{ "action": "transfer", "authToken": "IDTOKEN",
  "channelId": "CHANNEL_ID", "sessionId": "SESSION_ID",
  "targetAgentId": "AGENT_ID" }
```

### Configure a webhook

`manage_webhooks` `action: "create"` with `name`, `url`, and `triggerTypes` (a string
array):

```json
{ "action": "create", "authToken": "IDTOKEN",
  "name": "CRM events", "url": "https://example.com/hook",
  "triggerTypes": ["crm_record_created"] }
```

## 4. When something goes wrong

- **401** — the token expired: call `refresh`, then retry with the new `idToken`.
- **403** — the logged-in user's role can't perform this action.
- **429** — rate limited: wait the number of seconds in the error message, then retry.
- **Validation errors** — the message names the missing/invalid field; fix and retry.

## Reference

Every tool, action, typed request field, and response shape is documented in
`references/tools.md`. Read it when you need the complete field list for an action.
