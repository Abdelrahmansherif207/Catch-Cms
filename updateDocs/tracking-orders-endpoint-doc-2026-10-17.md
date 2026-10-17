# Order Tracking — List Orders (GET /api/v1/admin/tracking/orders) — full query-param doc

> Ready-to-paste reference for the Apidog endpoint (`GET /admin/tracking/orders`,
> project **meem-commerce**, folder `Admin/Order/Order Shipment & dashboard & view all`).
> Source: provided endpoint specification (code-verified backend) + CMS frontend sync
> shipped in this change (types, serializer, quick-range presets, status color mapping).

## Summary

Paginated order list for operations monitoring. **No validation** — unknown filter
values filter literally (possibly zero rows), unknown `sort_by` falls back to
`created_at`. `payment_status` / `payment_method` accept single, comma-separated,
or array values; relative date filters scope `created_at`.

- **Method/Path:** `GET /api/v1/admin/tracking/orders`
- **Controller:** `App\Http\Controllers\Api\Admin\AdminOrderTrackingController@listOrders`
- **Auth:** `auth:sanctum` + in-method `authorizeAdmin` (defense-in-depth)
- **Permission:** `view-orders` (Spatie `hasPermissionTo` / gate; legacy admin WITHOUT it is denied when the permission system is available)
- **Rate limit:** `throttle:admin` — 400/min per user id (or IP for guests)
- **Route name:** `api.admin.tracking.orders`
- **No `422` and no `404` contract** — no validation, no lookup.

## Request

Headers:

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | `Bearer <sanctum-token>` |
| Accept | Recommended | `application/json` |

Query inputs (complete list):

| Field | Type | Required | Behavior | Default | Example |
|---|---|---|---|---|---|
| `status` | string | No | `where('status', v)` when `filled()` | — | `pending` |
| `payment_status` | string/array | No | Split on `,` + trim → alias-expand → `whereIn` | — | `paid`, `paid,failed`, `payment_status[]=paid` |
| `payment_method` / `payment_type` | string/array | No | `payment_method ?? payment_type`, split `,` → `whereIn('payment_method', …)` | — | `online` |
| `payment_gateway` | string | No | `where('payment_gateway', v)` when filled | — | `myfatoorah` |
| `fulfillment_status` | string | No | `where('fulfillment_status', v)` when filled | — | `processing` |
| `search` | string | No | `LIKE %v%` over `order_number` OR `user_email` OR `user_phone` OR `name` | — | `ORD-00000042` |
| `date_from` | datetime | No | `created_at >= v` when filled | — | `2026-01-01` |
| `date_to` | datetime | No | `created_at <= v` when filled | — | `2026-12-31` |
| `older_than` | string/int | No | `parseRelativeDuration` → `created_at <= cutoff`; unparsable → no filter; **wins over** `older_than_days/hours/months` | — | `30d`, `3_days`, `2 days`, `1w`, `1m`, `1y`, `30` |
| `older_than_days` / `older_than_hours` / `older_than_months` | int | No | `created_at <= now()-X`; first filled wins; only when `older_than` absent | — | `30` |
| `newer_than` | string/int | No | Same parser → `created_at >= cutoff`; unparsable → no filter; **wins over** `within_days` | — | `7d` |
| `within_days` | int | No | `created_at >= now()-X days`; only when `newer_than` absent | — | `7` |
| `sort_by` | string | No | Whitelist `created_at, updated_at, total_price, status, id`; else falls back | `created_at` | `total_price` |
| `sort_order` | string | No | `asc` (case-insensitive) → asc; anything else → desc | `desc` | `asc` |
| `per_page` | int | No | Clamped 1–100 | `50` | `50` |

`payment_status` alias expansion:

| Input value | Expands to |
|---|---|
| `pending` | +`pending`, `PAYMENT_STATUS_PENDING` |
| `paid` / `success` | +`paid`, `success`, `PAYMENT_STATUS_SUCCESS` |
| `failed` | +`failed`, `PAYMENT_STATUS_FAILED` |
| `refunded` | +`refunded`, `PAYMENT_STATUS_REFUNDED` |
| anything else | passes through literally |

## Response — 200

`ApiResponse::apiResponse(__('message.MESSAGE.ORDERS_RETRIEVED_SUCCESSFULLY'), 200, true, $paginator)`
(`en` → `"Orders retrieved successfully."`). Rows at `data.data` are full order models
with `user` + latest `statusHistory`.

```json
{
  "status": 200,
  "message": "Orders retrieved successfully.",
  "success": true,
  "data": {
    "data": [
      { "id": 1, "order_number": "ORD-00000001", "status": "pending" }
    ],
    "links": {},
    "meta": { "current_page": 1, "per_page": 50, "total": 1 }
  }
}
```

## Errors (all Error code `None`)

| HTTP | Trigger | Body | Message (`en`) |
|---|---|---|---|
| 401 | Missing/invalid token | `{message, status:false}` | `Unauthenticated.` |
| 403 | No `view-orders` | `{message, status:false}` | `Forbidden. Missing required permission: view-orders.` |
| 405 | Non-GET method | `{message, status:false}` | `Method Not Allowed` |
| 429 | `throttle:admin` exceeded | `{success:false, message, data:null}` | `Too many requests. Please try again later.` |
| 500 | Unexpected failure | `{message, status:false}` | Exception message when `app.debug`, else `Internal Server Error` |

Caveat: array-typed unexpected values (e.g. `?period[]=x` on scalar params) can bubble
to the generic 500 branch instead of filtering.

## Apidog parameters snippet

```yaml
parameters:
  - name: status
    in: query
    required: false
    schema: { type: string }
    description: Exact order status filter (applied only when filled).
  - name: payment_status
    in: query
    required: false
    schema: { type: string }
    description: >
      Multi-value (single, comma-separated, or array; split on ',' + trimmed).
      Aliases: pending → +pending/PAYMENT_STATUS_PENDING; paid/success →
      +paid/success/PAYMENT_STATUS_SUCCESS; failed → +failed/PAYMENT_STATUS_FAILED;
      refunded → +refunded/PAYMENT_STATUS_REFUNDED; others pass through literally.
      Applied via whereIn when filled.
  - name: payment_method
    in: query
    required: false
    schema: { type: string }
    description: Multi-value whereIn on payment_method. Wins over payment_type.
  - name: payment_type
    in: query
    required: false
    schema: { type: string }
    description: Fallback alias of payment_method (backend `payment_method ?? payment_type`).
  - name: payment_gateway
    in: query
    required: false
    schema: { type: string }
    description: Exact gateway filter (where when filled).
  - name: fulfillment_status
    in: query
    required: false
    schema: { type: string }
    description: Exact fulfillment-status filter (where when filled).
  - name: search
    in: query
    required: false
    schema: { type: string }
    description: LIKE %value% over order_number OR user_email OR user_phone OR name.
  - name: date_from
    in: query
    required: false
    schema: { type: string }
    description: Created-at lower bound (created_at >= value).
  - name: date_to
    in: query
    required: false
    schema: { type: string }
    description: Created-at upper bound (created_at <= value).
  - name: older_than
    in: query
    required: false
    schema: { type: string }
    description: >
      Relative older-than filter via parseRelativeDuration (created_at <= cutoff).
      Formats: plain int (days), 2d, 3_days, "2 days", 1w, 1_week, 1m, 1_month, 1y.
      Unparsable → NO filter. Wins over older_than_days/hours/months.
  - name: older_than_days
    in: query
    required: false
    schema: { type: integer }
    description: created_at <= now()-X days (only when older_than absent).
  - name: older_than_hours
    in: query
    required: false
    schema: { type: integer }
    description: created_at <= now()-X hours (first filled wins; only when older_than absent).
  - name: older_than_months
    in: query
    required: false
    schema: { type: integer }
    description: created_at <= now()-X months (first filled wins; only when older_than absent).
  - name: newer_than
    in: query
    required: false
    schema: { type: string }
    description: Relative newer-than filter (created_at >= cutoff). Same parser/formats as older_than. Wins over within_days.
  - name: within_days
    in: query
    required: false
    schema: { type: integer }
    description: created_at >= now()-X days (only when newer_than absent).
  - name: sort_by
    in: query
    required: false
    schema: { type: string, enum: [created_at, updated_at, total_price, status, id] }
    description: Whitelisted sort column; anything else silently falls back to created_at.
  - name: sort_order
    in: query
    required: false
    schema: { type: string, enum: [asc, desc] }
    description: "'asc' (case-insensitive) → asc; anything else → desc. Default desc."
  - name: per_page
    in: query
    required: false
    schema: { type: integer, minimum: 1, maximum: 100, default: 50 }
    description: Page size — server-clamped min(max(value,1),100).
```

## CMS sync (this change)

- `FetchTrackingOrdersParams` now covers every param above (multi-value +
  relative dates previously missing).
- `fetchTrackingOrders` joins arrays with `,` and sends `payment_method ?? payment_type`.
- Tracking orders page gained a quick-range preset select (`newer_than`/`older_than`)
  that is mutually exclusive with the datetime pickers.
- Status color mapping (semantic tokens, light+dark):
  - order: pending=amber, processing=orange, completed/delivered=green, cancelled/failed=red, refunded=violet
  - payment: paid/success=green, pending=amber, failed=red, refunded=violet (alias keys covered)
  - fulfillment: pending=gray, processing=blue, picking=cyan, packing=indigo, ready_to_ship=amber, shipped=brand blue, delivered=green, cancelled=red
  - rows: amber left border for open orders older than 7d, red past 30d
