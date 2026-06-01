# Mavra Agents — Domain Knowledge

How to configure AI agents well via `manage_agents` (and the related agent tools).
Pair this with `prompt-syntax.md` for writing the `customPrompt`.

## Agent fields (create / update)

| Field | Type | Default | Notes |
|---|---|---|---|
| `title` | string | — (required) | 1–100 chars. |
| `customPrompt` | string | — (required) | The agent's script. Supports the `@`-decorator syntax — see `prompt-syntax.md`. |
| `description` | string | — | Free-text. |
| `provider` | enum | `openai` | `openai` \| `anthropic` \| `google` \| `azure_openai` \| `bedrock`. Must be enabled for the account. |
| `model` | string | `gpt-4o` | Must be enabled for the account/provider. Deprecated models auto-map to `gpt-4o`. |
| `contextSize` | number | — | **Must be 800–128000 tokens** (≈1 message per 800 tokens). The API errors if out of range or omitted on create — always pass a valid value (e.g. 4000). |
| `temperature` | number | — | 0.0–2.0. Ignored by reasoning models (o-series, GPT-5). |
| `reasoningEffort` | enum | — | `none` \| `minimal` \| `low` \| `medium` \| `high`. Only for reasoning models. |
| `webhookUrl` | string (https) | — | Per-agent outbound webhook (POSTs `{sessionId, message}` per turn). `webhookSecret` auto-generated. |
| `avatarColor` | string | — | UI only. |
| `tags` | string[] | — | Organize/filter agents. |
| `timezone` | string (IANA) | — | e.g. `America/Sao_Paulo`. Injected into the prompt for date/time awareness. |
| `mergeTools` | boolean | `false` | Merge similar tool declarations to reduce noise. |
| `knowledgeBaseMode` | enum | `always` | `always` (pre-query KB every turn) or `tool` (agent calls a search tool when it decides to). |
| `knowledgeBasePrompt` | string | — | Custom retrieval instructions. |
| `status` | enum | `active` | `active` \| `inactive` (inactive = won't respond). |

### Guardrails (fields on the agent, set via create/update)

| Field | Type | Default | Notes |
|---|---|---|---|
| `guardrailsEnabled` | boolean | `false` | Second-pass reviewer judges each agent action before it executes. |
| `guardrailsProvider` | enum | falls back to `provider` | Reviewer provider. |
| `guardrailsModel` | string | `gpt-4o-mini` | Reviewer model (must be enabled). |
| `guardrailsCustomPrompt` | string | default prompt | Criteria for what to block/approve. |
| `guardrailsMaxRetries` | 1 \| 2 \| 3 | `2` | Retries after a rejection before the reply is blocked. |

**Default guardrails prompt:** block when the agent contradicts the script, invents
unsupported facts, commits to forbidden actions, or skips a required step; approve
otherwise (permissive about phrasing/tone). When all retries are rejected, the turn is
**blocked** — no tool calls, no message sent, a `guardrails_blocked` system message is
recorded. Recover with `manage_messages:retry-agent-reply`.

## Providers & models

- **Providers:** `openai`, `anthropic`, `google`, `azure_openai`, `bedrock`.
- **OpenAI models** include the GPT-5.x / GPT-5 / GPT-4.1 / GPT-4o families and the
  o-series reasoning models (`o3`, `o3-mini`, `o4-mini`, `o1`). Reasoning models use
  `reasoningEffort` and ignore `temperature`. Only models enabled for the account are
  accepted — if a create/update is rejected for the model, pick an enabled one.

## Knowledge base (`manage_agent_knowledge`)

RAG over uploaded documents (stored in a per-agent vector store).
- **Supported files:** PDF, DOCX, XLSX, PPTX, ODT/ODS/ODP, TXT, HTML, CSV/TSV, Markdown,
  XML, JSON. Max ~100 MB per file.
- **Flow:** the file must already be uploaded to S3 (via the agent knowledge
  request-upload flow), then `add` references it with `fileKey`, `name`, `fileName`,
  `contentType`, `size`. Items index asynchronously (`pending → indexing → ready`).
- **Modes:** `always` (auto-injected each turn) vs `tool` (agent searches on demand).

## Media library (`manage_agent_media`)

Pre-uploaded files the agent can send via `@sendMedia(name)`.
- **Categories:** image, audio, video, document. Audio may convert asynchronously.
- **Flow:** upload to S3 first, then `add` with `fileKey`, `name`, `fileName`,
  `contentType` (+ optional `description` that tells the AI when to use it). The `name`
  is what you reference in `@sendMedia`.

## Other agent tools

- **`manage_agent_versions`** (prompt versioning): every prompt change creates a version;
  `list` / `get` / `revert` to roll back safely with an audit trail.
- **`manage_agent_test_sessions`**: interactive test panel — `create` a session,
  `send-message` (async), `retry` a blocked turn, `save-as-test`, `truncate`.
- **`manage_agent_tests`**: saved regression tests — `run`, `get-results`, `set-baseline`,
  `set-status`, `reset`, `stop`, `delete`.
- **`manage_agent_feedback`**: operators submit corrections (what was wrong / expected
  behavior); when enabled, corrections are pre-queried each turn to improve the agent.
- **`manage_agents:execute`**: one-shot synchronous test run with a message.
- **`manage_agents:debug` / `:trace`**: inspect resolved config / a message's tool trace.

## Tips

- Always set a valid `contextSize` (e.g. 4000) on create.
- Write the `customPrompt` with the `@`-syntax (see `prompt-syntax.md`) — that's where
  flows, tool calls, CRM writes, transfers, and follow-ups come from.
- Turn on guardrails for high-stakes agents; keep the default reviewer model unless you
  need otherwise.
