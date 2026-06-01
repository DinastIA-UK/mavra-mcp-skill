# Mavra Agent Prompt Syntax

The agent `customPrompt` is **not** plain text — Mavra parses a special `@`-decorator
and `{{variable}}` syntax that turns prompts into flows, tool calls, CRM writes, and
more. Write prompts using these constructs to unlock the platform's power. Plain natural
language still works, but you lose flows, tool calls, CRM updates, transfers, etc.

## Global rules

- **Decorators are case-insensitive** (`@IF` = `@if`); **variable paths are case-sensitive**.
- **Names must exist**: `@Tool(X)`, `@Agent(X)`, `@updateCRM("Kanban","field")`,
  `@transferAgent("Agent")` reference real tools/agents/kanbans/fields in the account.
  Mismatches are dropped (with a warning) or error at parse time.
- **Use double quotes** for string params. Unresolved `{{variables}}` are silently removed.

## Flow control — `@IF / @THEN / @ELSEIF / @ELSE / @END`

```
@IF the customer asks about pricing [price, cost, quote]
@THEN
  @Tool(SendPricingGuide)
@ELSEIF they ask for a demo [demo, trial]
@THEN
  @Tool(ScheduleDemo)
@ELSE
  Continue qualifying the lead.
@END
```

- Condition text is free English (passed to the AI, not evaluated by code).
- The optional `[keyword, list]` after a condition improves tool-calling reliability.
- `@THEN` without a matching `@IF` is a parse error. Blocks may nest.

## Tool calls — `@Tool(Name, param=value)`

```
@Tool(SendEmail)
@Tool(UpdateCustomer, id={{session.id}}, email={{crm.custom["Email"]}})
@Tool(ScheduleMeeting, date={{date}})        # {{date}} with no known prefix = AI fills it
```

Parameter value kinds: **fixed literal** (`status=new`), **template variable**
(`{{crm.custom["Email"]}}`, resolved at runtime), **AI-provided** (`{{city}}` — the model
supplies it). Reference a tool's response with `@Tool.Name.field`.

## Route to another agent — `@Agent(Name)`

```
@IF issue is technical
@THEN @Agent(TechnicalSupport)
@END
```

Exposes the named agent as a routing option.

## Write CRM fields — `@updateCRM("Kanban", "field", "description", "default")`

```
@updateCRM("Sales Pipeline", "status", "Mark 'Qualified' when budget + timeline confirmed")
@updateCRM("Sales Pipeline", "amount", "", "5000")          # fixed default, no AI guidance
```

- `kanban` + `field` required (exact, case-sensitive). Provide **description OR default**
  (at least one) — both empty is a parse error.
- `field` can be `status`, `title`, or any custom field. Works with all field types
  (text, number, currency, date, select, multiselect, boolean, email, phone, url…).

## Transfer the session — `@transferAgent("Agent", "Kanban", "instructions")`

```
@transferAgent("BillingAgent", "Billing Pipeline")
@transferAgent("Escalation", "VIP", "Customer requested account review")
```

Only `agentName` required; the target must be active and configured on the channel.
Empty `instructions` ⇒ the AI provides them dynamically.

## Follow-ups — `@followUp("desc", delayMinutes)` / `@cancelFollowUp("reason")`

```
@followUp("Check if the customer received the quote", 1440)   # 1440 min = 24h
@cancelFollowUp("Customer already purchased")
```

`@followUp` description required; `delayMinutes` optional (falls back to the rule
default). `@cancelFollowUp` with no args cancels all pending follow-ups for the session.

## Pause the AI — `@pauseAI("reason")`

```
@IF discount request over 20%
@THEN @pauseAI("High discount needs manager approval")
@END
```

Stops automatic replies (human takes over). Empty reason is a parse error.

## Send media — `@sendMedia(item1, item2)[noCaption]`

```
@sendMedia(product_demo_video, pricing_sheet)
@sendMedia(logo_image)[noCaption]
```

Names must match items in the agent's **media library** (see `agents.md` →
`manage_agent_media`). `[noCaption]` disables the caption parameter.

## Variables — `{{...}}`

| Variable | Meaning |
|---|---|
| `{{channel.name}}` / `{{channel.type}}` / `{{channel.identifier}}` / `{{channel.status}}` | Current channel info |
| `{{session.id}}` / `{{session.messageCount}}` / `{{session.startedAt}}` | Current session |
| `{{crm.title}}` / `{{crm.status}}` / `{{crm.createdAt}}` / `{{crm.updatedAt}}` | Linked CRM record |
| `{{crm.custom["Field Name"]}}` | A custom field on the current kanban (exact name) |
| `{{crm.kanban["Kanban Name"].fields["Field Name"]}}` | A field on a *specific* kanban |
| `{{custom.path.to.value}}` | Arbitrary custom context data |

## Worked example

```
You are a sales agent for Acme. You're talking to {{crm.title}} via {{channel.type}}.

@IF customer mentions pricing [price, cost]
@THEN
  @Tool(SendPricingGuide)
@ELSEIF customer asks for a demo [demo, trial]
@THEN
  @Tool(ScheduleDemo, email={{crm.custom["Email"]}})
@ELSE
  Continue qualifying the lead.
@END

@updateCRM("Sales Pipeline", "status", "Mark 'Qualified' when budget + timeline confirmed")

@IF customer is ready to move forward
@THEN @followUp("Follow up on contract review", 1440)
@END

@IF customer already purchased
@THEN
  @cancelFollowUp("Already a customer")
  @transferAgent("OnboardingAgent")
@END
```
