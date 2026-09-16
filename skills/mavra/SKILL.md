---
name: mavra
description: >-
  Use when the user wants to manage their Mavra account through an AI client —
  creating or editing AI agents, tools, kanbans, CRM records, channels, webhooks,
  contacts, sessions, messages, WhatsApp templates, or bulk messaging campaigns
  via the Mavra MCP server. Triggers: "Mavra", "my CRM", "my agents", "manage my
  pipeline", "send a campaign", "bulk message", connecting the Mavra MCP server.
metadata:
  author: mavra
  version: "1.2.0"
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

**Important — the `customPrompt` has a special syntax.** It is NOT just plain text: Mavra
parses `@`-decorators and `{{variables}}` for flows, tool calls, CRM writes, transfers,
follow-ups, and media. To write effective agents, read **`references/prompt-syntax.md`**.
Quick taste:

```
@IF customer asks about pricing [price, cost]
@THEN @Tool(SendPricingGuide)
@ELSE Continue qualifying the lead.
@END
@updateCRM("Sales Pipeline", "status", "Mark 'Qualified' when budget is confirmed")
```

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

### Run a bulk campaign

Campaigns have three parts: an **audience** (who), a **campaign** (the goal), and one
or more **deliveries** (what/when/how fast). Deliveries are what actually send.

```
manage_audiences  preview   → confirm the real size FIRST
manage_audiences  create    → audienceId
manage_campaigns  create    → campaignId
manage_templates  search    → an APPROVED templateName (WhatsApp only)
manage_deliveries create    → deliveryId
manage_campaigns  launch    → SENDS
campaign_reports  report    → results
```

**`launch` sends real WhatsApp messages to real people and cannot be undone.** Always
call `manage_audiences` `preview` first, tell the user the real number, and get an
explicit go-ahead before launching. Never treat "set up a campaign" as permission to
send one.

```json
{ "action": "preview", "authToken": "IDTOKEN",
  "definition": { "type": "crm_filter", "kanbanId": "KANBAN_ID", "status": "qualified" } }
```

To stop a running campaign, use `pause` (recoverable) rather than `cancel`, which
permanently skips every pending recipient and cannot be resumed.

Read **`references/campaigns.md`** before building one — it covers the three audience
types, live vs snapshot mode, the three-phase contact-list upload, quiet hours and
throttling, and what each failure mode means.

### Configure a webhook

`manage_webhooks` `action: "create"` with `name`, `url`, and `triggerTypes` (a string
array):

```json
{ "action": "create", "authToken": "IDTOKEN",
  "name": "CRM events", "url": "https://example.com/hook",
  "triggerTypes": ["crm_record_created"] }
```

### Channels & WhatsApp

Create/edit channels with `manage_channels` (requires `name`, `type`, `identifier`,
`defaultAgentId`). Full WhatsApp (Meta Cloud API) setup is also supported: create a
connection with `manage_connections`, the channel with `manage_channels`, then link them
with `manage_whatsapp` `action: "setup"`. See `references/channels.md` for the
step-by-step flow.

## 4. When something goes wrong

- **401** — the token expired: call `refresh`, then retry with the new `idToken`.
- **403** — the logged-in user's role can't perform this action.
- **429** — rate limited: wait the number of seconds in the error message, then retry.
- **Validation errors** — the message names the missing/invalid field; fix and retry.

## Reference

Read these on demand for complete, typed detail:

- **`references/tools.md`** — every tool, action, typed request field, and response shape.
- **`references/prompt-syntax.md`** — the agent `customPrompt` `@`-decorator + `{{variable}}` language (essential for writing agents).
- **`references/agents.md`** — all agent fields, providers/models, guardrails, knowledge base, media, versioning, testing, feedback.
- **`references/crm.md`** — CRM records, custom field types, field groups, statuses, kanbans, filters, search.
- **`references/channels.md`** — channel types, contacts, and the WhatsApp connection setup flow (`manage_connections` + `manage_whatsapp`).
- **`references/chat-and-settings.md`** — sessions, messages (send vs send-as-agent vs human reply), chat notes, provider keys, webhooks + event types.
- **`references/campaigns.md`** — bulk campaigns: audiences, deliveries, launching safely, contact-list uploads, reporting.
