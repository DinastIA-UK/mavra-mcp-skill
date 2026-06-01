# Mavra Channels, WhatsApp & Contacts — Domain Knowledge

For `manage_channels` and `manage_contacts`.

## WhatsApp connection setup (via `manage_connections` + `manage_whatsapp`)

Full WhatsApp (Meta Cloud API "BYOT") setup IS available through the MCP. The
end-to-end flow:

1. **Create the connection** — `manage_connections` `action: "create"` with
   `connectionType: "whatsapp_custom_app"`, `name`, `accessToken` (Meta token),
   `businessAccountId` (WABA id), optional `appId`/`appSecret`. The response includes the
   `connectionId`, the webhook URL + verify token, and the available phone numbers.
2. **Create the channel** — `manage_channels` `action: "create"` with type
   `whatsapp_byot`, the phone as `identifier`, and a `defaultAgentId`. Returns `channelId`.
3. **Link them** — `manage_whatsapp` `action: "setup"` with `channelId`, `connectionId`,
   `phoneNumberId` (a phone id from step 1).
4. **Register the phone if needed** — `manage_connections` `action: "register-phone"`
   with `connectionId` + `phoneNumberId` (optional 2FA `pin`). Check status first with
   `action: "phone-statuses"` or `"available-phones"`.
5. **Configure the Meta webhook** — get the URL + verify token via `manage_whatsapp`
   `action: "webhook-info"` (channelId) and set them in the Meta App. Verify the channel
   with `action: "test-channel"`.

`manage_connections` also supports `list`, `get`, `update`, `delete`, `test`, and
`add-waba`/`remove-waba` (additional WhatsApp Business Accounts). See `tools.md` for the
full typed field list of each action.

> The unauthenticated Meta webhook callback routes (`/providers/whatsapp-byot/webhook/*`)
> are called by Meta, not users, so they are intentionally not MCP tools.

## Channels (`manage_channels`)

Required to create: `name`, `type`, `identifier`, `defaultAgentId`.

**Channel types:** `whatsapp_byot` (official Cloud API, bring-your-own Meta token),
`whatsapp_no` (non-official, QR pairing), `whatsapp` (deprecated), `api`, `web`, `sms`,
`telegram`, `instagram`. `identifier` meaning depends on type (phone number for
WhatsApp/SMS, slug/URL for api/web, bot handle for telegram, etc.).

Useful optional fields: `description`, `allowedAgentIds`, `assignedUserIds`,
`defaultKanbanId`, `startWithAiPaused` (operators reply first), `show24hWindow`,
`splitByBreakline` / `splitMessageDelayMs` / `splitMessageDelimiter` (split long AI
replies), `aggregationBufferMs` (wait before AI triggers), `forwardIncomingToWebhook`,
`backgroundAiEnabled`, `status` (`active`|`inactive`|`pending_verification`).

Actions: `create`, `get`, `list`, `update`, `delete` (soft delete).

### WhatsApp 24-hour window

Meta only allows free-form messages within 24h of the customer's last message; outside
that window you must use pre-approved **templates**. `show24hWindow` toggles the UI timer
(always on for WhatsApp). Template management is not part of this MCP.

## Contacts (`manage_contacts`)

Fields: `displayName` (required), `identifiers` (required — array of
`{ type, value, isPrimary }`), `channelId` (required on create), plus `firstName`,
`lastName`, `avatarUrl`, `tags`, `customFields`.

**Identifier types:** `phone`, `email`, `external_id`, `whatsapp_id`. Phone/whatsapp_id
are normalized to digits; email is lowercased/trimmed.

Actions: `create`, `get`, `list`, `update`, `delete`, `search` (by `type` + `value`,
e.g. find by phone or email).
