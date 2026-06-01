# Mavra Channels, WhatsApp & Contacts — Domain Knowledge

For `manage_channels` and `manage_contacts`.

## ⚠️ WhatsApp connection setup is NOT available through this MCP (yet)

Creating a WhatsApp **connection** (Meta credentials, phone-number registration, webhook
verification) uses backend endpoints that the MCP does **not** expose:
`/connections/*` and `/providers/whatsapp-byot/*`. Through the MCP you can only
create/manage the channel record itself — not the underlying WhatsApp/Meta connection.

**To fully connect WhatsApp you must use the Mavra web app / REST API directly.** The
end-to-end flow (for reference) is:
1. `POST /connections` — provide Meta App ID/Secret, WABA id, access token → returns a
   `connectionId`, webhook URL + verify token, and the available phone numbers.
2. `POST /channels` — create the channel (type `whatsapp_byot`, the phone as `identifier`,
   a `defaultAgentId`). *(This step IS doable via the MCP's `manage_channels:create`.)*
3. `POST /providers/whatsapp-byot/setup` — link `channelId` + `connectionId` +
   `phoneNumberId`.
4. If required, `POST /connections/{id}/phones/{phoneId}/register` (optional 2FA PIN), and
   configure the Meta webhook with the verify token from step 1.

> If you need WhatsApp connection management in the MCP, it requires adding
> `manage_connections` + WhatsApp-BYOT tools to the server — currently a gap.

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
