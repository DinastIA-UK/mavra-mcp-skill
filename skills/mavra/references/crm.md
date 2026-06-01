# Mavra CRM & Kanban — Domain Knowledge

For `manage_crm_records`, `manage_crm_fields`, `manage_crm_filters`, `search_crm`,
`manage_kanbans`.

## CRM records

A record is a customer/deal tracked on a kanban. Key fields:

| Field | Type | Notes |
|---|---|---|
| `recordId` | string | The identifier (NOT `id`). Use it for get/update/delete/merge. |
| `title` | string | Required on create. |
| `status` | string | A status `value` from the record's kanban. |
| `customFields` | object | Keyed by **field id** (not name), e.g. `{ "field_123": "value" }`. |
| `assignedUserIds` | string[] | Assigned team members. |
| `kanbanId` | string | The board the record lives on (defaults to the account's default kanban). |
| `kanbanHistory` | array | `{ kanbanId, enteredAt, leftAt? }` trail of boards visited (single-record GET only). |
| `createdBy` / `updatedBy` / `createdAt` / `updatedAt` | — | Audit fields. |

> To set custom fields you need each field's **id** (from `manage_crm_fields:list-fields`),
> because the same display name can exist on different kanbans with different ids.

## Custom field types (`manage_crm_fields`)

Supported `type` values: `text`, `textarea`, `number`, `currency`, `date`, `datetime`,
`select`, `multiselect`, `boolean`, `email`, `phone`, `url`.

Field definition config: `name`, `type`, `description`, `options` (for select/
multiselect), `validation` (`{min,max,pattern,required}`), `order`, `width`
(`half`|`full`), `placeholder`, `defaultValue`, `showOnCard`, `showSumOnColumn` (sum
currency per column), `kanbanId` (fields are per-kanban), `groupId` (optional group).

Actions (namespaced in the `action`): `list-fields`, `create-field`, `update-field`,
`delete-field`, `reorder-fields`, and the field-group + status actions below.

### Field groups

Collapsible sections of fields, per kanban: `name`, `kanbanId` (required), `order`,
`isCollapsedByDefault`. Actions: `list-field-groups`, `create-field-group`,
`update-field-group`, `delete-field-group`, `reorder-field-groups`.

### Statuses

A status = `{ value, label, color, order, isDefault }`. Statuses are per-kanban; exactly
one is the default. Default pipeline: New → Contacted → Qualified → Proposal →
Negotiation → Won / Lost. Actions: `list-statuses`, `update-statuses` (replace the set),
`delete-status` (requires a `targetStatus` to move existing records onto).

## Kanban boards (`manage_kanbans`)

Fields: `name`, `slug` (auto), `description`, `ownerId`, `allowedUserIds`, `order`,
`isDefault`, plus per-board `statuses` and `fields`, and `recordCount`. One board is the
account default; new records land there unless `kanbanId` is given. Each board has its
**own** fields and statuses. Actions: `list`, `get`, `create`, `update`, `delete`,
`set-default`, `manage-users` (`add`/`remove` user-id arrays).

## Saved filters (`manage_crm_filters`)

A filter = `{ name, logic: "and"|"or", conditions: [...] , kanbanId? }`. A condition =
`{ field, operator, value?, valueTo? }`. Operators: `equals`, `notEquals`, `contains`,
`greaterThan`, `lessThan`, `between` (uses `valueTo`), `isEmpty`, `isNotEmpty`.

## Search (`search_crm`)

Powered by Typesense (typo-tolerant, prefix, OR across tokens).
- **`search`**: `q` (or `query`), plus `status`, `kanbanId`, `assignedUserId`,
  `page`/`pageSize`. Searches the title + all custom fields.
- **`suggest`**: quick suggestions (`q`, min 2 chars).
- **`aggregations`**: per-status counts and **currency sums** for fields marked
  `showSumOnColumn` (optionally scoped by `kanbanId` / `assignedUserId`).
