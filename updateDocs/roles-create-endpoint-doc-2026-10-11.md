# Roles — Create Role (POST /api/v1/roles) — corrected doc

> Ready-to-paste replacement for the Apidog endpoint description.
> Verified live against `https://catch.mohammedtareq.me/api/v1` on 2026-10-11 (curl).
> Marked values: ✅ = live-verified, ⚠️ = from doc, not live-verified.

## Summary

Creates a new api-guard role. The machine name is derived from `display_name.en` (lowercase, spaces → underscores). Guard is always `api`. The server reads **only** `display_name` — any other body fields (`name`, `guard_name`, `permissions`, …) are ignored.

- **Method/Path:** `POST /api/v1/roles`
- **Controller:** `RoleAndPermissionController@addRole`
- **Auth:** Sanctum bearer token (`auth:sanctum`) ✅
- **Permission:** `create-roles` (constructor middleware) ✅
- **Rate limit:** `throttle:admin` (400/min per user id/IP)
- **No path/query/body params other than `display_name`.**

## Request

Headers:

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | `Bearer <sanctum-token>` |
| Content-Type | Yes | `application/json` |
| Accept | Recommended | `application/json` |
| lang | Optional | `en` \| `ar` (other values ignored) |

Body:

```json
{
  "display_name": {
    "en": "Qa Role",
    "ar": "QA"
  }
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| display_name | object (locale → string) | Yes | `required`, `array`; each locale value `required`, `string`, unique among stored roles' translations (`display_name.en`, `display_name.ar`) |

`name` is always derived: `"Qa Role"` → `"qa_role"`. Omitting the `en` key passes validation and derives an empty name (edge case; a second such call hits the 500 path).

## Success — 200 ✅

```json
{
  "status": 200,
  "message": "Role added successfully",
  "success": true,
  "data": {
    "id": 11,
    "name": "qa_role",
    "display_name": "{\"en\":\"Qa Role\",\"ar\":\"QA\"}",
    "created_at": "2026-10-11T10:03:44.000000Z",
    "updated_at": "2026-10-11T10:03:44.000000Z"
  }
}
```

Field notes (live-verified):
- `data.display_name` is the **raw stored JSON string**, not an object.
- `data.guard_name` is **NOT returned** (contrary to the previous draft claiming "always present").
- `data.permissions` is **NOT returned** (relation not loaded on create; it IS returned on `GET /roles`).
- Message by locale: en `Role added successfully`, ar `تمت إضافة الدور بنجاح` ⚠️ (en verified).

## Errors

| Status | Body shape | Message | Verified |
|---|---|---|---|
| 401 | `{message, status:false}` | "Unauthenticated" | ✅ |
| 403 | `{message, status:false}` | "User does not have the required permissions." (ar: "لا يمتلك المستخدم الصلاحيات المطلوبة.") | ⚠️ |
| 405 | `{message, status:false}` | "Method Not Allowed" | ✅ |
| 422 (type) | `{message, status:false, errors}` | "The display name must be an array." with `errors.display_name` | ✅ |
| 422 (duplicate) | `{message, status:false, errors}` | "The display_name.en has already been taken. (and 1 more error)" with `errors: {display_name.en: [...], display_name.ar: [...]}` | ✅ |
| 409 | `{status, message, success:false}` | "Database error occurred. Please check your request and try again." | ⚠️ |
| 429 | `{success, message, data:null}` | "Too many requests. Please try again later." | ⚠️ |
| 500 | `{status, message, success:false}` | "Something went wrong." | ⚠️ |

422 examples (live-verified, exact bytes):

```json
{"message":"The display name must be an array.","status":false,
 "errors":{"display_name":["The display name must be an array."]}}
```

```json
{"message":"The display_name.en has already been taken. (and 1 more error)","status":false,
 "errors":{"display_name.en":["The display_name.en has already been taken."],
           "display_name.ar":["The display_name.ar has already been taken."]}}
```

Validation runs before persistence, so duplicate display names yield 422 (not 500).

## Apidog response Example — replace with:

```json
{
  "status": 200,
  "message": "Role added successfully",
  "success": true,
  "data": {
    "id": 12,
    "name": "qa_role",
    "display_name": "{\"en\":\"Qa Role\",\"ar\":\"QA\"}",
    "created_at": "2026-10-11T10:03:44.000000Z",
    "updated_at": "2026-10-11T10:03:44.000000Z"
  }
}
```

(do NOT use `unknown:translated ROLE_ADDED_SUCCESSFULLY` / `"data": {"id": 1}`)
