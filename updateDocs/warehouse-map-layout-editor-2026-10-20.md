# Warehouse Map — Manual Layout Editor (2026-10-20)

Server: none (localStorage v1) — plus the exact contract the backend is expected to deliver
when shared persistence is wanted (section "Backend contract to add").

## What this is

An edit mode for the read-only warehouse map: holders of `manage-location` (frontend key
`PERMISSIONS.locations.manage`) can drag bins and whole aisle columns to simulate the real
warehouse, then save. Until the backend endpoint exists, the arrangement persists in the
browser's localStorage — per user/device. Signatures were designed as a drop-in swap for
the future API.

## Verified behaviors (unit-tested, 45 warehouse-map tests green)

| # | Behavior | Where |
|---|---|---|
| 1 | Per-warehouse storage key `warehouse-map-v1:layout:{id}`, record `{version: 1, updatedAt, positions: {binId: {x,y}}}` | `lib/map-layout-store.ts` |
| 2 | Corrupted JSON / wrong version / non-finite coords → degrade to auto layout, never crash | `loadLayout` try/catch + parse guards |
| 3 | `saveLayout` writes the FULL effective position set (≤100 bins → tiny JSON); quota failure keeps the in-memory copy for the session | `saveLayout` catch |
| 4 | Effective position resolution: EDIT (in-session) > SAVED (storage) > auto-computed slot | `withOverrides` + `mergePositions` |
| 5 | Aisle headers are RE-DERIVED (min x / min y − GROUP_HEADER_HEIGHT) from their member bins — a header can never drift away from its column | `withOverrides` |
| 6 | Dragging an aisle header translates its WHOLE column (delta vs derived header pos, clamped ≥0, snapped to 8px) | `handleGroupTranslate` in the page + RF `snapGrid:[8,8]` |
| 7 | Individual bins drag independently; run auto layout stays the fallback for never-touched/new bins | `onNodesPositionChange` → editPositions map |
| 8 | Save → toast; Discard (unsaved) → ConfirmDialog; Reset-to-auto → ConfirmDialog (destructive tone) and clears storage | page handlers |

UI states: toolbar gains "Edit layout" (manage-location holders); in edit mode it becomes
Save (disabled until dirty) / Done editing / Reset-to-auto + "unsaved changes" hint; a
dashed info strip above the canvas explains drag semantics in the session language.
Switching warehouses re-hydrates that warehouse's arrangement (edits are per-session).

## Frontend architecture (backend-swap ready)

- `lib/map-layout-store.ts` exposes only `loadLayout / saveLayout / clearLayout(warehouseId)`
  returning `Map<binId, {x, y}>`. When the backend ships, these three functions become the
  only file touched: same signatures, bodies call the API (and `withOverrides` needs a
  react-query hook instead of useEffect hydration — one place).

## Backend contract to add (when ready)

| Endpoint | Body / Response | Permission | Notes |
|---|---|---|---|
| `GET /admin/warehouses/{warehouse}/map-layout` | `200 {status, message, success, data: {positions: {"12": {"x": 320, "y": 160}, …}, version: int, updated_at}}` — `200` with empty `positions` when never saved | `manage-location` | 404 on unknown warehouse id |
| `PUT /admin/warehouses/{warehouse}/map-layout` | JSON body `{positions: {"12": {"x": 320, "y": 160}, …}}`; echoes the saved layout | `manage-location` | Atomic whole-map save (no per-bin writes); positions with ids no longer existing may be silently dropped; `version` bumps for cache invalidation |

Why a dedicated blob instead of `LocationResource.metadata`:

1. The metadata field is currently write-only (accepted on POST/PUT, never returned —
   live-verified 2026-10-13); read-through would change every locations consumer.
2. One request loads/saves the entire arrangement — the locations index is already
   capped at 100 rows with no pagination, and layout needs stable visibility even when
   the bins list truncates or a bin is filtered out.
3. Labels/notes could later live in the blob too (aisle label offsets, custom captions).

Known limitation while on localStorage: the arrangement is device-local and shared between
all admin users on that browser profile; the backend endpoint removes that.
