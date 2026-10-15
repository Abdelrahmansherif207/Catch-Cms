# Roles — Delete Role (DELETE /api/v1/roles/{id}) — corrected doc

> Ready-to-paste replacement for the Apidog endpoint description.
> Verified live against `https://catch.mohammedtareq.me/api/v1` on 2026-10-11 (curl).
> Marked values: ✅ = live-verified, ⚠️ = from doc, not live-verified.

## Summary

Permanently hard-deletes an api-guard role, refusing roles that still have assigned users.

- **Method/Path:** `DELETE /api/v1/roles/{id}`
- **Controller:** `RoleAndPermissionController@destroyRole`
- **Auth:** Sanctum bearer token (`auth:sanctum`) ✅
- **Permission:** `delete-roles` (constructor middleware) ✅
- **Rate limit:** `throttle:admin` (400/min per user id/IP)
- **No body / query params. No 422 contract.** Non-numeric or unknown `{id}` → 404 (guard-scoped `Role::findById($id, 'api')`).

## Request

Headers:

| Header | Required | Value |
|---|---|---|
| Authorization | Yes | `Bearer <sanctum-token>` |
| Accept | Recommended | `application/json` |
| lang | Optional | `en` \| `ar` (other values ignored) |

Example: `DELETE /api/v1/roles/11`

## Success — 200 ✅ (hard delete confirmed)

```json
{
  "status": 200,
  "message": "Role deleted successfully",
  "success": true
}
```

Live-verified: **no `data` key**; row is permanently removed afterwards (role list dropped 10 → 9).
Message by locale: en `Role deleted successfully` ✅, ar `تم حذف الدور بنجاح` ⚠️.

## Errors

| Status | Body shape | Message | Verified |
|---|---|---|---|
| 401 | `{message, status:false}` | "Unauthenticated" | ✅ |
| 403 | `{message, status:false}` | "User does not have the required permissions." (ar: "لا يمتلك المستخدم الصلاحيات المطلوبة.") | ⚠️ |
| 404 | `{message, status:false}` | en: "Not found" ✅ / ar: "غير موجود" ✅ (NOT "Role not found") | ✅ |
| 405 | `{message, status:false}` | "Method Not Allowed" | ✅ |
| 409 (assigned users) | `{status, message, success:false}` | "Cannot delete role with assigned users" (NOT "Role is assigned to one or more users. Remove all user associations first.") | ✅ |
| 409 (QueryException) | same body as above | same message | ⚠️ |
| 429 | `{success, message, data:null}` | "Too many requests. Please try again later." | ⚠️ |
| 500 | `{status, message, success:false}` | "Something went wrong." | ⚠️ |

Live-verified exact bytes:

```json
{"message":"Unauthenticated","status":false}
```

```json
{"message":"Not found","status":false}
```

```json
{"status":409,"message":"Cannot delete role with assigned users","success":false}
```

The 409 response keeps the role row intact (reference: role 2 super_admin attempt on 2026-10-11).

## Apidog response Example — replace with:

```json
{
  "status": 200,
  "message": "Role deleted successfully",
  "success": true
}
```

(do NOT use `unknown:translated ROLE_DELETED_SUCCESSFULLY`, and do NOT include the `data` key)
