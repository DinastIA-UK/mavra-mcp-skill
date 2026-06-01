# Mavra Chat, Providers & Webhooks — Domain Knowledge

For `manage_sessions`, `manage_messages`, `manage_chat_notes`, `manage_providers`,
`manage_webhooks`.

## Sessions (`manage_sessions`)

A session is one conversation. Key fields: `id`, `channelId`, `agentId`, `contactId`,
`ownerId`, `crmRecordId`, `sessionName` (+ `sessionNameCustom` to prevent auto-rename),
`messageCount`, `lastMessageAt`, `lastUserMessageAt` (drives the WhatsApp 24h window),
`aiPaused`, `isTest`, `activeKanbanId`.

- **`ai-paused`**: when paused, the AI stops auto-replying; operators still send manually.
  Use the `ai-paused` action with `sessionId` + `aiPaused: true|false`.
- Actions: `create`, `list` (rich filters: `agentId`, `channelId`, `contactId`,
  `ownerId`, `hasUserReply`, `aiPaused`, `query`, `crmStatus`…), `get`, `rename`,
  `delete`, `snapshot`, `ai-paused`, `transfer`, `link-crm`.

## Messages (`manage_messages`)

Message fields: `role` (`user`|`assistant`|`system`), `content`, `direction`
(`incoming`|`outgoing`|`echo`), `status` (`pending`|`sent`|`delivered`|`read`|`failed`),
`attachments`, `reactions`, `isNote`, `isHumanReply`, `replyTo`.

**Three ways to send — pick the right one:**
- **`send`** (`POST /messages`): create/append to a conversation; auto-creates a session;
  may trigger AI per channel config. Needs `content` and/or `attachments` (≥1).
- **`send-as-agent`**: background AI invocation on an existing session (`content` required).
- **`send-human-reply`**: operator reply sent straight through the channel (no AI).

Other actions: `list`, `delete-all`, `list-by-record` (messages for a CRM record),
`react` / `unreact`.

**Attachments flow:** request a presigned S3 upload (request-upload), PUT the file, then
send with `attachments: [{ fileKey, fileName, contentType, size }]`. Categories: image,
audio, video, document. Audio may be transcribed/converted.

## Chat notes (`manage_chat_notes`)

Internal operator notes on a message (never sent to the customer/externally).
- `set` requires `channelId`, `sessionId`, `messageId`, `content`; optional
  `isNoteVisibleToAi` — when true the note enters AI context with a guardrail forbidding
  disclosure to the customer.
- `delete` removes the note.

## AI provider keys (`manage_providers`)

Providers: `openai`, `anthropic`, `google`, `azure_openai`, `bedrock`. Keys are stored
encrypted; only a key prefix is shown back.
- `add-key` (`provider`, `apiKey`, optional `name`), `list-keys`, `delete-key`,
  `validate` (test a key), `enabled` (list active providers/models available to agents).

## Webhooks (`manage_webhooks`)

A webhook = `{ name, url, triggerTypes[], isActive, kanbanFilter?, fieldFilter?,
includeSystemFields?, secret }`.

**Trigger/event types:** `crm_field_update`, `crm_record_created`, `crm_record_deleted`,
`crm_record_kanban_changed`, `ai_pause`, `follow_up_executed`, `follow_up_failed`,
`note_created`, `note_updated`, `note_deleted`.

- **Security:** each delivery is signed — header `X-Maia-Signature`, HMAC-SHA256 over the
  raw body using the webhook secret; also `X-Maia-Timestamp`. Verify with a constant-time
  compare.
- **Delivery/retry:** 10s timeout; up to 3 retries with exponential backoff (1s→2s→4s);
  retried on 5xx / timeout / 429, not on other 4xx. Respond 2xx to ack.
- Actions: `create`, `get`, `list`, `update`, `delete`, `test` (send a sample event),
  `deliveries` (delivery log), `regenerate-secret`.
