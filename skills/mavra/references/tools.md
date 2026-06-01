# Mavra MCP — Tool & Action Reference

Every Mavra MCP tool, its actions, the typed request fields, and the response shape.
All `manage_*` tools take an `action` plus `authToken` (the **idToken** from `login`,
or an API token). Identifier/path fields (e.g. `agentId`, `recordId`) are required for
the actions that use them.

> **Token note:** pass the **idToken** returned by `login` as `authToken` — not the
> accessToken. Mavra authorizes requests using the ID token's claims.

> Timestamps (`createdAt`, `updatedAt`, etc.) are numbers in **epoch milliseconds**.

## Index

- **Auth:** `login`, `refresh`, `whoami`
- **Agents:** `manage_agents`, `manage_agent_versions`, `manage_agent_test_sessions`,
  `manage_agent_tests`, `manage_agent_feedback`, `manage_agent_knowledge`,
  `manage_agent_media`, `manage_tools`
- **CRM & Kanban:** `manage_crm_records`, `manage_crm_fields`, `manage_crm_filters`,
  `search_crm`, `manage_kanbans`
- **Settings:** `manage_providers`, `manage_channels`, `manage_webhooks`, `manage_contacts`
- **Chat:** `manage_sessions`, `manage_messages`, `manage_chat_notes`

---

## Auth

### `login`

Authenticate with a Mavra email and password.

**Request fields:**

| field | type | required | description |
|-------|------|----------|-------------|
| email | string | yes | Account email. |
| password | string | yes | Account password. |

**Example arguments:**

```json
{ "email": "you@example.com", "password": "••••••" }
```

**Response:**

```
{
  idToken: string,        // ← pass this as authToken on every other tool
  accessToken: string,
  refreshToken: string,
  expiresIn: number,      // seconds until the token expires
  user: { id: string, email: string, name: string,
          role: string, companyId: string, status: string }
}
```

### `refresh`

Exchange a refreshToken for a fresh idToken.

**Request fields:**

| field | type | required | description |
|-------|------|----------|-------------|
| refreshToken | string | yes | The refreshToken from `login`. |

**Response:** `{ idToken: string, accessToken: string, expiresIn: number }`

### `whoami`

Return the authenticated user, company, and groups. Confirms the token is valid and
reveals the caller's role (which governs what they may do).

**Request fields:** only `authToken`.

**Response:**

```
{ user: { id: string, email: string, name: string, role: string,
          status: string, companyId: string, createdAt: number,
          updatedAt: number, lastLoginAt: number, isImpersonating: boolean },
  company: { id: string, name: string, subdomain: string, plan: string,
             status: string, accountType: string, featureFlags: object } | null,
  groups: string[] }
```

---

## Agents

### `manage_agents`

CRUD + run for AI agents. Guardrails are fields on the agent (set via create/update),
not a separate endpoint.

#### `manage_agents` — action: `create`

Create an AI agent.

**Request fields:**

| field | type | required | description |
|-------|------|----------|-------------|
| title | string | yes | Agent name. |
| customPrompt | string | yes | The agent's system prompt. |
| description | string | no | Free-text description. |
| provider | string | no | AI provider (default `openai`). |
| model | string | no | Model id (default `gpt-4o`). |
| contextSize | number | no | Context window in tokens. **Must be 800–128000** if provided, or the API returns an error. |
| temperature | number | no | Sampling temperature. |
| reasoningEffort | string | no | Reasoning effort hint. |
| webhookUrl | string | no | Per-agent webhook URL. |
| avatarColor | string | no | UI avatar color. |
| tags | string[] | no | Free-form tags. |
| timezone | string | no | Agent timezone. |
| mergeTools | boolean | no | Merge tool definitions. |
| guardrailsEnabled | boolean | no | Turn guardrails on. |
| guardrailsProvider | string | no | Guardrails AI provider. |
| guardrailsModel | string | no | Guardrails model id. |
| guardrailsCustomPrompt | string | no | Guardrails instructions. |
| guardrailsMaxRetries | number (1\|2\|3) | no | Retries when guardrails block a reply. |

**Example arguments:**

```json
{ "action": "create", "authToken": "<idToken>",
  "title": "Sales Assistant", "customPrompt": "You are a helpful sales assistant.",
  "contextSize": 4000 }
```

**Response:**

```
{ id: string, accountId: string, title: string, customPrompt: string,
  provider: string, model: string, contextSize: number,
  status: "active" | "inactive", knowledgeBaseMode: string, mergeTools: boolean,
  guardrailsEnabled: boolean, guardrailsProvider: string, guardrailsModel: string,
  guardrailsCustomPrompt: string, guardrailsMaxRetries: number,
  feedbackEnabled: boolean, feedbackCount: number,
  createdAt: number, updatedAt: number }
```

#### `manage_agents` — action: `get`

Get a single agent by id.

**Request fields:**

| field | type | required | description |
|-------|------|----------|-------------|
| agentId | string | yes | The agent id. |

**Response:** a single Agent object (same shape as `create`).

#### `manage_agents` — action: `list`

List agents (paginated).

**Request fields:**

| field | type | required | description |
|-------|------|----------|-------------|
| limit | number | no | Page size. |
| nextToken | string | no | Pagination cursor. |

**Response:** `{ items: Agent[], nextToken?: string }`

#### `manage_agents` — action: `update`

Update an agent. Accepts every `create` field (all optional here) plus `agentId`.
Use this to configure guardrails on an existing agent.

**Request fields:**

| field | type | required | description |
|-------|------|----------|-------------|
| agentId | string | yes | The agent id. |
| title | string | no | New name. |
| customPrompt | string | no | New system prompt. |
| status | "active" \| "inactive" | no | Enable/disable. |
| contextSize | number | no | 800–128000. |
| guardrailsEnabled | boolean | no | Toggle guardrails. |
| guardrailsMaxRetries | number (1\|2\|3) | no | Guardrails retries. |
| _…any other create field_ | — | no | All create fields are accepted. |

**Response:** the updated Agent object.

#### `manage_agents` — action: `delete`

Delete an agent.

**Request fields:** `agentId: string` (required).

**Response:** a success acknowledgement.

#### `manage_agents` — action: `execute`

Run the agent once with a message (synchronous test run).

**Request fields:**

| field | type | required | description |
|-------|------|----------|-------------|
| agentId | string | yes | The agent id. |
| message | string | yes | The user message to run. |

**Response:** the agent's run result (reply + any tool calls).

#### `manage_agents` — action: `debug`

Get resolved debug info (config, tools, knowledge state).

**Request fields:** `agentId: string` (required).

**Response:** an object describing the agent's resolved runtime configuration.

#### `manage_agents` — action: `trace`

Get the tool-execution trace for a processed message.

**Request fields:**

| field | type | required | description |
|-------|------|----------|-------------|
| agentId | string | yes | The agent id. |
| messageId | string | yes | The processed message id. |

**Response:** the execution trace for that message.

### `manage_agent_versions`

Prompt version history (Feature 24).

#### `manage_agent_versions` — action: `list`

List prompt versions for an agent.

**Request fields:** `agentId: string` (required); `limit?: number`, `nextToken?: string`.

**Response:** `{ items: PromptVersion[], nextToken?: string }`

#### `manage_agent_versions` — action: `get`

Get a specific prompt version.

**Request fields:** `agentId: string` (required), `version: number` (required).

**Response:** a single PromptVersion object.

#### `manage_agent_versions` — action: `revert`

Revert the agent to a previous prompt version.

**Request fields:**

| field | type | required | description |
|-------|------|----------|-------------|
| agentId | string | yes | The agent id. |
| targetVersion | number | yes | Version to revert to. |
| changeNote | string | no | Note describing the revert. |

**Response:** the updated agent / new version record.

### `manage_agent_test_sessions`

The interactive test panel. `send-message` is asynchronous (results are processed in
the background); over MCP it returns the acknowledgement.

#### `manage_agent_test_sessions` — action: `create`

Create a test session.

**Request fields:** `agentId: string` (required); other fields passed through.

**Response:** the created test session (includes a `sessionId`).

#### `manage_agent_test_sessions` — action: `send-message`

Send a test message (async; provide a unique `jobId` to track it).

**Request fields:**

| field | type | required | description |
|-------|------|----------|-------------|
| agentId | string | yes | The agent id. |
| sessionId | string | yes | The test session id. |
| message | string | yes | The message to send. |
| jobId | string | yes | A unique id you generate to track this run. |

**Response:** a `202`-style acknowledgement (result arrives asynchronously).

#### `manage_agent_test_sessions` — action: `retry`

Retry a guardrails-blocked turn in a test session.

**Request fields:** `agentId: string`, `sessionId: string` (both required).

**Response:** an acknowledgement.

#### `manage_agent_test_sessions` — action: `save-as-test`

Persist the test session as a reusable test case.

**Request fields:** `agentId: string`, `sessionId: string` (both required); test config passed through.

**Response:** the saved test case.

#### `manage_agent_test_sessions` — action: `truncate`

Truncate test-session messages from a 0-based index.

**Request fields:** `agentId: string`, `sessionId: string`, `fromIndex: number` (all required).

**Response:** an acknowledgement.

### `manage_agent_tests`

Saved regression test cases (Step Functions-backed).

#### `manage_agent_tests` — action: `list`

List saved tests for an agent.

**Request fields:** `agentId: string` (required); `limit?: number`, `nextToken?: string`, `category?: string`, `status?: string`.

**Response:** `{ items: Test[], nextToken?: string }`

#### `manage_agent_tests` — action: `run`

Run a saved test.

**Request fields:** `agentId: string`, `testId: string` (both required); run options passed through.

**Response:** a run handle / execution id.

#### `manage_agent_tests` — action: `get-results`

Get results for a saved test.

**Request fields:** `agentId: string`, `testId: string` (both required); `limit?`, `nextToken?`, `status?`, `triggeredBy?`, `startDate?`, `endDate?`.

**Response:** `{ items: TestResult[], nextToken?: string }`

#### `manage_agent_tests` — action: `set-baseline`

Set the baseline responses for a test.

**Request fields:** `agentId: string`, `testId: string`, `updates: object[]` (all required).

**Response:** an acknowledgement.

#### `manage_agent_tests` — action: `set-status`

Enable or disable a test.

**Request fields:** `agentId: string`, `testId: string`, `status: "active" | "disabled"` (all required).

**Response:** an acknowledgement.

#### `manage_agent_tests` — action: `reset`

Reset a test (purge results, optionally re-run).

**Request fields:** `agentId: string`, `testId: string` (both required); reset options passed through.

**Response:** an acknowledgement.

#### `manage_agent_tests` — action: `stop`

Stop a running test execution.

**Request fields:** `agentId: string`, `testId: string`, `resultId: string` (all required).

**Response:** an acknowledgement.

#### `manage_agent_tests` — action: `delete`

Delete a test and its results.

**Request fields:** `agentId: string`, `testId: string` (both required).

**Response:** a success acknowledgement.

### `manage_agent_feedback`

The agent feedback loop (Feature 51).

#### `manage_agent_feedback` — action: `create`

Create a feedback entry.

**Request fields:**

| field | type | required | description |
|-------|------|----------|-------------|
| agentId | string | yes | The agent id. |
| messageId | string | yes | The message the feedback is about. |
| whatWasWrong | string | yes | What the agent got wrong. |
| expectedBehavior | string | yes | What it should have done. |

**Response:** the created feedback entry (includes its `createdAt`).

#### `manage_agent_feedback` — action: `list`

List feedback entries for an agent.

**Request fields:** `agentId: string` (required).

**Response:** `{ items: Feedback[] }` (or an array of feedback entries).

#### `manage_agent_feedback` — action: `update`

Update a feedback entry. Requires its `createdAt` timestamp (the entry's sort key).

**Request fields:**

| field | type | required | description |
|-------|------|----------|-------------|
| agentId | string | yes | The agent id. |
| feedbackId | string | yes | The feedback id. |
| createdAt | number | yes | The entry's createdAt (epoch ms). |
| whatWasWrong | string | no | Updated text. |
| expectedBehavior | string | no | Updated text. |

**Response:** the updated feedback entry.

#### `manage_agent_feedback` — action: `delete`

Delete a feedback entry.

**Request fields:** `agentId: string`, `feedbackId: string`, `createdAt: number` (all required).

**Response:** a success acknowledgement.

#### `manage_agent_feedback` — action: `toggle`

Enable or disable the feedback loop for the agent.

**Request fields:** `agentId: string`, `enabled: boolean` (both required).

**Response:** an acknowledgement reflecting the new state.

### `manage_agent_knowledge`

Knowledge base (RAG). `add` references a file already uploaded to S3.

#### `manage_agent_knowledge` — action: `add`

Add a knowledge item.

**Request fields:**

| field | type | required | description |
|-------|------|----------|-------------|
| agentId | string | yes | The agent id. |
| fileKey | string | yes | S3 key of the uploaded file. |
| name | string | yes | Display name. |
| fileName | string | yes | Original file name. |
| contentType | string | yes | MIME type. |
| size | number | yes | File size in bytes. |

**Response:** the created knowledge item.

#### `manage_agent_knowledge` — action: `list`

List knowledge items.

**Request fields:** `agentId: string` (required).

**Response:** the agent's knowledge items.

#### `manage_agent_knowledge` — action: `delete`

Delete a knowledge item.

**Request fields:** `agentId: string`, `knowledgeItemId: string` (both required).

**Response:** a success acknowledgement.

### `manage_agent_media`

Media library. `add` references a file already uploaded to S3.

#### `manage_agent_media` — action: `add`

Add a media item.

**Request fields:**

| field | type | required | description |
|-------|------|----------|-------------|
| agentId | string | yes | The agent id. |
| fileKey | string | yes | S3 key of the uploaded file. |
| name | string | yes | Display name. |
| fileName | string | yes | Original file name. |
| contentType | string | yes | MIME type. |

**Response:** the created media item.

#### `manage_agent_media` — action: `list`

List media items.

**Request fields:** `agentId: string` (required).

**Response:** the agent's media items.

#### `manage_agent_media` — action: `update`

Update a media item's metadata.

**Request fields:** `agentId: string`, `mediaId: string` (both required); `name?: string`, `description?: string`.

**Response:** the updated media item.

#### `manage_agent_media` — action: `delete`

Delete a media item.

**Request fields:** `agentId: string`, `mediaId: string` (both required).

**Response:** a success acknowledgement.

### `manage_tools`

Custom HTTP tools that agents can call.

#### `manage_tools` — action: `create`

Create a tool.

**Request fields:**

| field | type | required | description |
|-------|------|----------|-------------|
| name | string | yes | Tool name. |
| description | string | yes | What the tool does. |
| endpoint | string | yes | HTTP endpoint the tool calls. |
| method | string | yes | HTTP method. |
| headers | object | no | Static headers. |
| queryParams | object | no | Static query params. |
| parameters | array | no | Parameter definitions. |
| bodyTemplate | string | no | Request body template. |
| responseMapping | object | no | Maps response fields. |

**Response:** the created tool (with its `id`).

#### `manage_tools` — action: `get`

Get a tool by id. **Request fields:** `toolId: string` (required). **Response:** the Tool.

#### `manage_tools` — action: `list`

List tools. **Request fields:** `limit?: number`, `nextToken?: string`. **Response:** `{ items: Tool[], nextToken?: string }`.

#### `manage_tools` — action: `update`

Update a tool. **Request fields:** `toolId: string` (required) + any create field. **Response:** the updated Tool.

#### `manage_tools` — action: `delete`

Delete a tool. **Request fields:** `toolId: string` (required). **Response:** acknowledgement.

---

## CRM & Kanban

### `manage_crm_records`

CRUD + merge for CRM records.

#### `manage_crm_records` — action: `create`

Create a CRM record.

**Request fields:**

| field | type | required | description |
|-------|------|----------|-------------|
| title | string | yes | Record title. |
| kanbanId | string | no | Target kanban (sent as a query param). |
| status | string | no | Initial status value. |
| customFields | object | no | Map of custom field id → value. |
| assignedUserIds | string[] | no | Users to assign. |
| channelId | string | no | Originating channel. |

**Example arguments:**

```json
{ "action": "create", "authToken": "<idToken>", "title": "Acme Corp", "kanbanId": "kanban_…" }
```

**Response:**

```
{ accountId: string, recordId: string, title: string, status: string,
  customFields: object, assignedUserIds: string[], kanbanId: string,
  kanbanHistory: Array<{ kanbanId: string, enteredAt: number, leftAt?: number }>,
  createdAt: number, updatedAt: number, createdBy: string, updatedBy: string }
```

> The record identifier is **`recordId`** (not `id`); use it for `get`/`update`/`delete`/`merge`.

#### `manage_crm_records` — action: `get`

Get a record by id. **Request fields:** `recordId: string` (required). **Response:** the
CRM record (single-record responses also include a `kanbanHistory` array).

#### `manage_crm_records` — action: `list`

List records (paginated, filterable).

**Request fields:** `status?: string`, `limit?: number`, `nextToken?: string`, `kanbanId?: string`, `assignedUserId?: string`.

**Response:** `{ items: CrmRecord[], nextToken?: string }`

#### `manage_crm_records` — action: `update`

Update/upsert a record. **Request fields:** `recordId: string` (required) + `title?`, `status?`, `customFields?: object`, `assignedUserIds?: string[]`. **Response:** the updated record.

#### `manage_crm_records` — action: `delete`

Delete a record. **Request fields:** `recordId: string` (required). **Response:** acknowledgement.

#### `manage_crm_records` — action: `merge`

Merge a source record into the target.

**Request fields:** `recordId: string` (the target, required), `sourceRecordId: string` (required).

**Response:** the merged record.

### `manage_crm_fields`

Custom fields, field groups, and statuses. The `action` namespaces each.

#### Fields

- **`list-fields`** — list custom fields. Fields: `kanbanId?: string`. Response: the field definitions.
- **`create-field`** — create a field. Required: `name: string`, `type: string`. Optional: `kanbanId?`, plus field options (`options`, `validation`, `order`, `width`, `placeholder`, `defaultValue`, `showOnCard`, `showSumOnColumn`). Response: the created field.
- **`update-field`** — update a field. Required: `fieldId: string`. Response: the updated field.
- **`delete-field`** — delete a field. Required: `fieldId: string`. Response: acknowledgement.
- **`reorder-fields`** — reorder fields. Required: `fieldIds: string[]`. Optional: `kanbanId?`. Response: acknowledgement.

#### Field groups

- **`list-field-groups`** — list groups. Response: the groups.
- **`create-field-group`** — create a group. Required: `name: string`, `kanbanId: string`. Optional: `order?: number`, `isCollapsedByDefault?: boolean`. Response: the created group.
- **`update-field-group`** — update a group. Required: `groupId: string`, `kanbanId: string` (query). Response: the updated group.
- **`delete-field-group`** — delete a group. Required: `groupId: string`. Response: acknowledgement.
- **`reorder-field-groups`** — reorder groups. Required: `groupIds: string[]`, `kanbanId: string`. Response: acknowledgement.

#### Statuses

- **`list-statuses`** — list CRM statuses. Response: the statuses.
- **`update-statuses`** — replace the statuses. Required: `statuses: object[]` (each `{ value, label, color?, kanbanId? }`). Optional: `kanbanId?`. Response: the updated statuses.
- **`delete-status`** — delete a custom status. Required: `statusValue: string`, `targetStatus: string` (records on the deleted status are moved to this one). Optional: `kanbanId?`. Response: acknowledgement.

### `manage_crm_filters`

Saved CRM filters.

- **`list`** — list saved filters. Response: the filters.
- **`create`** — create a filter. Required: `name: string`, `conditions: object[]`. Optional: `logic?: "and" | "or"`, `kanbanId?`. Response: the created filter.
- **`update`** — update a filter. Required: `filterId: string`. Response: the updated filter.
- **`delete`** — delete a filter. Required: `filterId: string`. Response: acknowledgement.

### `search_crm`

Full-text search + suggestions + aggregations.

#### `search_crm` — action: `search`

Search records.

**Request fields:** `q?: string` (or `query?`), `status?`, `page?: number`, `pageSize?: number`, `kanbanId?`, `assignedUserId?`.

**Response:** `{ items: CrmRecord[], page: number, pageSize: number, total: number }` (a paginated search result).

#### `search_crm` — action: `suggest`

Search suggestions. **Request fields:** `q: string` (required, min 2 chars). **Response:** suggestion list.

#### `search_crm` — action: `aggregations`

Status aggregations. **Request fields:** `kanbanId?: string`, `assignedUserId?: string`. **Response:** per-status counts/sums.

### `manage_kanbans`

Kanban boards.

#### `manage_kanbans` — action: `list`

List kanban boards.

**Request fields:** only `authToken`.

**Response:**

```
{ items: Array<{ id: string, accountId: string, name: string, slug: string,
                 ownerId: string, allowedUserIds: string[], order: number,
                 isDefault: boolean, recordCount: number, statuses: object[],
                 fields: object[], createdAt: number, updatedAt: number,
                 createdBy: string, updatedBy: string }> }
```

#### `manage_kanbans` — action: `get`

Get a board by id. **Request fields:** `id: string` (required). **Response:** a single Kanban.

#### `manage_kanbans` — action: `create`

Create a board. **Request fields:** `name: string` (required); `description?`, `allowedUserIds?: string[]`, `isDefault?: boolean`. **Response:** the created Kanban.

#### `manage_kanbans` — action: `update`

Update a board. **Request fields:** `id: string` (required) + `name?`, `description?`, `allowedUserIds?`, `ownerId?`. **Response:** the updated Kanban.

#### `manage_kanbans` — action: `delete`

Delete a board. **Request fields:** `id: string` (required). **Response:** acknowledgement.

#### `manage_kanbans` — action: `set-default`

Set a board as the default. **Request fields:** `id: string` (required). **Response:** acknowledgement.

#### `manage_kanbans` — action: `manage-users`

Add/remove users on a board. **Request fields:** `id: string` (required); `add?: string[]`, `remove?: string[]`. **Response:** the updated Kanban.

---

## Settings

### `manage_providers`

AI provider API keys.

- **`add-key`** — add a key. Required: `provider: string`, `apiKey: string`. Optional: `name?`. Response: the created key (id only; the secret is not echoed).
- **`list-keys`** — list configured keys. Response: the keys (without secrets).
- **`delete-key`** — delete a key. Required: `keyId: string`. Response: acknowledgement.
- **`validate`** — validate a key. Required: `keyId: string`, `provider: string`, `apiKey: string`. Response: validation result.
- **`enabled`** — list enabled providers. Response: the enabled providers.

### `manage_channels`

Channels.

#### `manage_channels` — action: `create`

Create a channel.

**Request fields:**

| field | type | required | description |
|-------|------|----------|-------------|
| name | string | yes | Channel name. |
| type | string | yes | Channel type (e.g. `api`, `whatsapp`). |
| identifier | string | yes | Channel identifier. |
| defaultAgentId | string | yes | Agent that handles this channel. |
| description | string | no | Free-text description. |
| allowedAgentIds | string[] | no | Agents allowed on this channel. |
| assignedUserIds | string[] | no | Users assigned. |
| defaultKanbanId | string | no | Default kanban for new records. |
| startWithAiPaused | boolean | no | Start sessions with AI paused. |

**Response:** the created channel (with its `id`).

#### `manage_channels` — action: `get`

Get a channel. **Request fields:** `channelId: string` (required). **Response:** the channel.

#### `manage_channels` — action: `list`

List channels. **Request fields:** only `authToken`. **Response:** the channels.

#### `manage_channels` — action: `update`

Update a channel. **Request fields:** `channelId: string` (required) + any create field, plus `status?: "active" | "inactive"`. **Response:** the updated channel.

#### `manage_channels` — action: `delete`

Delete a channel. **Request fields:** `channelId: string` (required). **Response:** acknowledgement.

### `manage_webhooks`

Webhook subscriptions.

#### `manage_webhooks` — action: `create`

Create a webhook.

**Request fields:**

| field | type | required | description |
|-------|------|----------|-------------|
| name | string | yes | Webhook name. |
| url | string | yes | Destination URL. |
| triggerTypes | string[] | yes | Event types to subscribe to (e.g. `["crm_record_created"]`). |
| kanbanFilter | object | no | Limit to specific kanbans. |
| fieldFilter | object | no | Limit to specific field changes. |
| includeSystemFields | boolean | no | Include system fields in payloads. |

**Response:** the created webhook (with its `id` and signing secret).

#### `manage_webhooks` — action: `get`

Get a webhook. **Request fields:** `webhookId: string` (required). **Response:** the webhook.

#### `manage_webhooks` — action: `list`

List webhooks. **Request fields:** only `authToken`. **Response:** the webhooks.

#### `manage_webhooks` — action: `update`

Update a webhook. **Request fields:** `webhookId: string` (required) + `name?`, `url?`, `isActive?: boolean`, `triggerTypes?: string[]`, filters. **Response:** the updated webhook.

#### `manage_webhooks` — action: `delete`

Delete a webhook. **Request fields:** `webhookId: string` (required). **Response:** acknowledgement.

#### `manage_webhooks` — action: `test`

Send a test event. **Request fields:** `webhookId: string` (required). **Response:** delivery result.

#### `manage_webhooks` — action: `deliveries`

List a webhook's delivery log. **Request fields:** `webhookId: string` (required); `status?`, `limit?`, `nextToken?`. **Response:** `{ items: Delivery[], nextToken?: string }`.

#### `manage_webhooks` — action: `regenerate-secret`

Regenerate the signing secret. **Request fields:** `webhookId: string` (required). **Response:** the new secret.

### `manage_contacts`

Contacts.

#### `manage_contacts` — action: `create`

Create a contact.

**Request fields:**

| field | type | required | description |
|-------|------|----------|-------------|
| displayName | string | yes | Display name. |
| identifiers | object[] | yes | Each `{ type, value, isPrimary? }` (type ∈ phone, email, external_id, whatsapp_id). |
| channelId | string | yes | Originating channel. |
| firstName | string | no | First name. |
| lastName | string | no | Last name. |
| tags | string[] | no | Tags. |
| customFields | object | no | Custom fields. |

**Response:** the created contact (with its `id`).

#### `manage_contacts` — action: `get`

Get a contact. **Request fields:** `contactId: string` (required). **Response:** the contact.

#### `manage_contacts` — action: `list`

List contacts (paginated). **Request fields:** `limit?: number`, `nextToken?: string`. **Response:** `{ items: Contact[], nextToken?: string }`.

#### `manage_contacts` — action: `update`

Update a contact. **Request fields:** `contactId: string` (required) + `displayName?`, `firstName?`, `lastName?`, `tags?`, `customFields?`, identifier mutations. **Response:** the updated contact.

#### `manage_contacts` — action: `delete`

Delete a contact. **Request fields:** `contactId: string` (required). **Response:** acknowledgement.

#### `manage_contacts` — action: `search`

Find a contact by identifier. **Request fields:** `type: string` (required, ∈ phone, email, external_id, whatsapp_id), `value: string` (required). **Response:** the matching contact(s).

---

## Chat

### `manage_sessions`

Conversation sessions.

#### `manage_sessions` — action: `create`

Create a session. **Request fields:** `agentId: string` (required); `channelId?`, `title?`, `customFields?`, `crmRecordId?` passed through. **Response:** the created session.

#### `manage_sessions` — action: `list`

List sessions (filterable, full-text searchable, paginated).

**Request fields:** `agentId?`, `channelId?`, `contactId?`, `ownerId?`, `hasUserReply?` (`"true"`/`"false"`), `aiPaused?` (`"true"`/`"false"`), `query?`, `crmStatus?`, `includeFacets?`, `limit?: number`, `nextToken?`.

**Response:** `{ items: Session[], nextToken?: string }`

#### `manage_sessions` — action: `get`

Get a session. **Request fields:** `channelId: string`, `sessionId: string` (both required). **Response:** the session.

#### `manage_sessions` — action: `rename`

Rename a session. **Request fields:** `channelId: string`, `sessionId: string`, `sessionName: string` (all required). **Response:** acknowledgement.

#### `manage_sessions` — action: `delete`

Delete a session and its messages. **Request fields:** `channelId: string`, `sessionId: string` (both required). **Response:** acknowledgement.

#### `manage_sessions` — action: `snapshot`

Get a full session snapshot. **Request fields:** `sessionId: string` (required). **Response:** the snapshot.

#### `manage_sessions` — action: `ai-paused`

Pause/unpause the AI for a session (dual-auth route — works with JWT or API token).

**Request fields:** `sessionId: string` (required), `aiPaused: boolean` (required).

**Response:** acknowledgement.

#### `manage_sessions` — action: `transfer`

Transfer a session to another agent.

**Request fields:** `channelId: string`, `sessionId: string`, `targetAgentId: string` (all required); `targetKanbanId?` optional.

**Response:** acknowledgement.

#### `manage_sessions` — action: `link-crm`

Link a CRM record to a session. **Request fields:** `channelId: string`, `sessionId: string`, `crmRecordId: string` (all required). **Response:** acknowledgement.

### `manage_messages`

Send and read messages.

#### `manage_messages` — action: `send`

Send a message. Provide `content` and/or `attachments` (at least one is required). The
endpoint auto-creates a session when needed.

**Request fields:**

| field | type | required | description |
|-------|------|----------|-------------|
| content | string | conditional | Message text. Required if no `attachments`. |
| agentId | string | no | Target agent. |
| sessionId | string | no | Existing session id. |
| externalUserId | string | no | External user identifier. |
| fromChannelIdentifier | string | no | Channel identifier. |
| channelType | string | no | e.g. `api`, `whatsapp`. |
| sessionName | string | no | Name for an auto-created session. |
| attachments | object[] | conditional | File attachments. Required if no `content`. |
| kanbanId | string | no | Kanban for an auto-created record. |

**Response:** the created message (and session info).

#### `manage_messages` — action: `list`

List messages in a session. **Request fields:** `channelId: string`, `sessionId: string` (both required); `limit?: number`, `nextToken?`, `direction?: "asc" | "desc"`. **Response:** `{ items: Message[], nextToken?: string }`.

#### `manage_messages` — action: `send-as-agent`

Send an agent message (background AI invocation). **Request fields:** `channelId: string`, `sessionId: string`, `content: string` (all required). **Response:** acknowledgement.

#### `manage_messages` — action: `send-human-reply`

Send an operator reply through the channel. **Request fields:** `channelId: string`, `sessionId: string` (both required); `content?` and/or `attachments?`. **Response:** the sent message.

#### `manage_messages` — action: `retry-agent-reply`

Retry a guardrails-blocked agent reply. **Request fields:** `channelId: string`, `sessionId: string` (both required). **Response:** acknowledgement.

#### `manage_messages` — action: `delete-all`

Delete all messages in a session. **Request fields:** `channelId: string`, `sessionId: string` (both required). **Response:** acknowledgement.

#### `manage_messages` — action: `list-by-record`

List messages linked to a CRM record. **Request fields:** `recordId: string` (required); `limit?`, `nextToken?`, `direction?`. **Response:** `{ items: Message[], nextToken?: string }`.

#### `manage_messages` — action: `react`

Add a reaction to a message. **Request fields:** `sessionId: string`, `messageId: string`, `emoji: string` (all required). **Response:** acknowledgement.

#### `manage_messages` — action: `unreact`

Remove a reaction. **Request fields:** `sessionId: string`, `messageId: string` (both required). **Response:** acknowledgement.

### `manage_chat_notes`

Internal operator notes on a message (Feature 43).

#### `manage_chat_notes` — action: `set`

Create or update the note on a message.

**Request fields:** `channelId: string`, `sessionId: string`, `messageId: string`, `content: string` (all required); `isNoteVisibleToAi?: boolean` optional.

**Response:** the note.

#### `manage_chat_notes` — action: `delete`

Delete the note on a message. **Request fields:** `channelId: string`, `sessionId: string`, `messageId: string` (all required). **Response:** acknowledgement.
