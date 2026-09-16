# Mavra Campaigns — Domain Knowledge

For `manage_campaigns`, `manage_audiences`, `manage_deliveries`, `campaign_reports`
and `manage_templates`. Field-by-field request/response detail is in
`references/tools.md`.

## The model

Three objects, and it matters that they are separate:

- **Audience** — *who*. A reusable, standalone targeting definition. One audience can
  be used by many campaigns.
- **Campaign** — *why*. A container with a conversion **goal** and aggregated stats.
  A campaign does not itself send anything.
- **Delivery** — *what, when, how fast*. Lives under a campaign and pairs an audience
  with a channel, a message and a schedule. **Deliveries are what send.**

A campaign with no deliveries sends nothing, no matter how many times it is launched.
One campaign can hold several deliveries — that is how you A/B a message or stagger
waves at different times.

## End-to-end flow

```
manage_audiences  preview   → confirm the real size FIRST
manage_audiences  create    → audienceId
manage_campaigns  create    → campaignId
manage_templates  search    → an APPROVED templateName (WhatsApp channels only)
manage_deliveries create    → deliveryId
manage_campaigns  launch    → SENDS
campaign_reports  report    → results
```

Get `channelId` from `manage_channels` `list`, and `kanbanId`/`status` values from
`manage_kanbans` and `manage_crm_fields` `list-statuses`.

## Safety rules — read before launching

**`launch` sends real WhatsApp messages to real people and cannot be undone.** There
is no draft mode, no undo, and no recall.

1. **Always `preview` first** and state the number back to the user. A `crm_filter`
   that looks narrow can match thousands of records.
2. **Get explicit approval before `launch`.** Never launch as a follow-on step to a
   request like "set up a campaign for X" — setting one up and sending it are
   different acts.
3. **`pause` is recoverable, `cancel` is not.** `cancel` marks every pending recipient
   `skipped` permanently; the campaign can never be resumed. If the user says "stop",
   `pause` unless they clearly mean abandon.
4. **`ai_chat_eval` audiences cost money at launch.** One LLM call per candidate, on
   the account's own provider key. `preview` returns `aiEvalRunsAtLaunch: true` and
   the candidate count — quote that number before launching.
5. **WhatsApp needs an APPROVED template.** A delivery pointing at a `PENDING` or
   deleted template fails at send time.

## Audience types

| `definition.type` | What it targets | Key fields |
|---|---|---|
| `crm_filter` | CRM records matching a kanban + status + conditions | `kanbanId`, `status`, `conditions`, `filterLogic` |
| `ai_chat_eval` | Contacts whose chat history an agent judges to match a rule | `criterion` (natural language), `evalAgentId`, plus the `crm_filter` fields to bound the candidate pool |
| `contact_list` | An explicit phone list | `entries` (inline, small lists) or `upload-entries`; `defaultCountryCode`; `kanbanId`/`status` here mean where auto-created CRM records LAND |

Note the asymmetry on `contact_list`: `kanbanId` and `status` are the **destination**
for CRM records created on a successful send, not a filter.

### `audienceMode`: live vs snapshot

Set per delivery, not per audience:

- **`live`** — re-runs the audience's filter at launch. The audience is whatever
  matches at that moment.
- **`snapshot`** — uses the frozen member set. Requires `manage_audiences` `resolve`
  with `materialize: true` **first**, otherwise there is nothing to send to.

## Uploading a contact list

`upload-entries` is a three-phase chunked protocol, and each phase can refuse if you
skip ahead:

1. `phase: "begin"` — clears the previous list. The clear is bounded per request, so
   **repeat `begin` until the response returns `clearComplete: true`**. Moving on
   early makes the old list merge into the new one.
2. `phase: "append"` — up to **500** entries per call. Repeat until the list is sent.
3. `phase: "commit"` — finalizes and sets the authoritative `entryCount`.

**Always reach `commit`.** While `entriesUploading` is set, the audience is treated as
half-written and any campaign using it refuses to launch — which is the point.

## Statuses

Campaign and delivery share one lifecycle: `draft` → `scheduled` → `freezing` →
`sending` → `completed`, with `paused`, `cancelled` and `failed` as off-ramps. A
campaign's status is **rolled up** from its deliveries.

Campaigns and deliveries are editable only while `draft` or `scheduled`. After that
the audience and message are frozen and `update` returns 409.

Per-recipient statuses (for the `report` drill-down): `pending`, `queued`, `sent`,
`delivered`, `read`, `replied`, `failed`, `skipped`, `opted_out`, `converted`.
A `skipped` recipient carries a `skipReason` — `invalid_phone`, `blocked`,
`opted_out`, `duplicate`, `no_consent`, `ai_excluded`, or `cancelled`.

## Goals and conversions

`goal` decides what counts as a conversion:

- `reached_status` — the contact's CRM record reaches `targetStatus`.
- `reached_kanban` — the record lands on `targetKanbanId`.

`attributionWindowDays` is how long after the send a status change still counts. The
`converted` figure in the report is driven entirely by this.

## Throttling and quiet hours

In `schedule`:

- `throttlePerMinute` — the send rate cap. Keep it conservative on a new WABA;
  bursting a cold number hurts its quality rating.
- `respectQuietHours` + `quietHoursStart`/`quietHoursEnd` + `timezone` — pauses
  sending overnight. With `contactTimezoneFieldId`, quiet hours follow each
  contact's own timezone rather than the account's.

## Reading results

`campaign_reports` `report` returns the funnel, a per-delivery breakdown, a
timeseries, and a paginated recipient list. To investigate failures, pass
`recipientStatus: "failed"` and page with `recipientsLimit` + `recipientsCursor`.

`campaign_reports` `compare` takes `ids` as a **comma-separated string**, not an
array — `"camp_1,camp_2"`. Omit it to compare every campaign on the account.

`manage_audiences` `performance` answers a different question: how one audience has
performed across every campaign that ever used it.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `launch` succeeds, `audienceTotal: 0` | The filter matched nothing at freeze time, or a `snapshot` delivery whose audience was never `resolve`d with `materialize: true`. |
| Launch refuses with an upload error | A contact-list upload never reached `commit` (`entriesUploading` still set). |
| `update` returns 409 | The campaign or delivery is past `scheduled`; it is frozen. |
| Every recipient `failed` | Usually the template — not APPROVED, deleted, or a variable mapping that does not match the template's `{{n}}` placeholders. |
| `manage_templates` returns 401 | An API token was used. Every template action except `search` requires the `idToken` from `login`. |
| `converted` stays 0 | The `goal` target status/kanban is wrong, or `attributionWindowDays` is too short. |
