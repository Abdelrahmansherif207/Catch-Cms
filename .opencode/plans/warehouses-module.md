# Warehouses Module — Implementation Plan

Backend: `https://catch.mohammedtareq.me/api/v1` (live-validated with admin token; admin@demo.com holds `View warehouse` + `Manage warehouse`).
Live-verified: index returns a **flat array** `{status, message, success, data: Warehouse[]}` (NO paginator wrapper); 404 = `"Resource Not Found"`; 401 = Arabic `غير مصرح`.

## Confirmed UX decisions
- New **Fulfillment** sidebar group → "Warehouses" (`Warehouse` lucide icon, `view-warehouse` permission)
- **List page** `/warehouses` + **detail page** `/warehouses/:id`
- No filters/search; fetch `limit=100` flat array
- **Archive** (soft delete) with simple warning — "will be archived, not permanently deleted"; success toast mirrors backend `"Warehouse archived successfully."`
- **Hide impossible row actions** (backend 422 guards): default row → hide Archive + Deactivate; inactive row → hide Set-default
- i18n en + ar ("Warehouses" / "المستودعات")
- `metadata` field omitted from v1 forms (optional API passthrough; live data is null)

## Files

### 1. Shared plumbing
- `src/shared/auth/permissions.ts` — add:
  ```ts
  warehouses: {
    view: 'view-warehouse',
    manage: 'manage-warehouse',
  },
  ```
- `src/shared/lib/query-keys.ts` — add `warehouses: { all, lists(), list(params), details(), detail(id) }`

### 2. Feature `src/features/warehouses/`
- `types/warehouse.types.ts` — `Warehouse` (id, code, name, address, city, country, status 'active'|'inactive', is_default, created_at, updated_at); `WarehousesListResponse` (flat array); `WarehouseDetailResponse`; `CreateWarehouseData` (code, name, address?, city?, country?, status?, is_default?); `UpdateWarehouseData` (name, address?, city?, country?)
- `api/warehouses.api.ts` — fetchWarehouses(limit=100), fetchWarehouseById, createWarehouse (POST → 201), updateWarehouse (PUT — 5 whitelisted fields only), archiveWarehouse (DELETE), activateWarehouse / deactivateWarehouse / setDefaultWarehouse (POST commands)
- `schemas/warehouse.schema.ts` — zod create (code ≤50 required, name ≤255 required, city/country ≤100 nullable, address nullable) / edit (5 fields, code/status/is_default excluded — server drops them)
- `hooks/use-warehouses.ts` — useWarehouses, useWarehouse, useCreateWarehouse, useUpdateWarehouse, useArchiveWarehouse, useActivateWarehouse, useDeactivateWarehouse, useSetDefaultWarehouse (sonner toasts + list/detail invalidation)
- `routes/warehouse.routes.ts` — `{ list: '/warehouses', detail: id => \`/warehouses/${id}\` }`
- `permissions/warehouse.permissions.ts` — re-export
- `components/` — warehouses-table (Code/Name/Location/Status/⭐Default/Created/actions, default row: no Archive+Deactivate, inactive row: no Set-default), warehouse-form-dialog (create+edit RHF+zod), warehouse-archive-dialog (warning wording), set-default via shared ConfirmDialog
- `pages/warehouses-page.tsx` — PageHeader + Create + refresh, flat-array table
- `pages/warehouse-detail-page.tsx` — DetailHero + info cards + edit dialog + lifecycle actions + archive
- `index.ts` — barrel (pages, routes, permissions, types, hooks)

### 3. Wiring
- `src/app/App.tsx` — lazy `/warehouses` + `/warehouses/:id` under `PermissionRoute permission={PERMISSIONS.warehouses.view}`
- `src/layouts/components/sidebar/nav-data.ts` — new Fulfillment group (`Warehouse` icon) → Warehouses item
- i18n `en`/`ar` translation.json — `warehouses.*` keys + `sidebar.fulfillment` + `sidebar.warehouses`

### 4. Verify
- `pnpm lint` + `pnpm build`
- Manual E2E vs catch API: list → create → edit → set-default → deactivate → activate → archive (guards invisible thanks to gating; 422 toasts if forced)

## Backend contracts (spec-verified)
| Action | Method/Path | Success | Guards |
|---|---|---|---|
| List | GET /admin/warehouses?limit=100 | 200 flat array | view-warehouse (route) + home scope; manage bypasses |
| Show | GET /admin/warehouses/{id} | 200 | cross-scope masked as 404 |
| Create | POST /admin/warehouses | 201 | manage-warehouse; dup code (withTrashed) → 422; blank code → 422; default-on-inactive → 422 |
| Update | PUT /admin/warehouses/{id} | 200 | metadata-only; PATCH → 405 |
| Archive | DELETE /admin/warehouses/{id} | 200 "Warehouse archived successfully." (no data) | default → 422 live text; NO restore |
| Activate | POST /admin/warehouses/{id}/activate | 200 fresh row | idempotent, no guards |
| Deactivate | POST /admin/warehouses/{id}/deactivate | 200 fresh row | default → 422 |
| Set-default | POST /admin/warehouses/{id}/set-default | 200 fresh row | inactive → 422 |
