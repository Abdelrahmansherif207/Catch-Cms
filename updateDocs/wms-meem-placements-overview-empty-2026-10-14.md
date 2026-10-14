# WMS Placements / Overview / Empty-Bin — Verification Report (2026-10-14)

Server: `https://meem.mohammedtareq.me/api/v1` — **note the switch**: the CMS `.env`
`VITE_API_BASE_URL` now points to meem (was catch.mohammedtareq.me). The earlier
reports in this folder (locations module, inventory stock) were authored against
catch and stay as history. This report documents the three endpoints shipped
2026-10-14 and the day's live round on meem.

Auth: token `5|VYth…` (global holder — overview returned `warehouse_id: null`,
`totals_scope: "global"`).

## Endpoints covered

1. `GET /api/v1/admin/inventory/overview` — stats for the CMS inventory page
2. `GET /api/v1/admin/products/{product}/placements` — multi-location read model
3. `DELETE /api/v1/admin/locations/{location}/products` — empty bin (housekeeping)

## Zero-mutation matrix (both GET endpoints + DELETE refusal paths)

| # | Probe | Live result |
|---|---|---|
| 1 | `GET /admin/inventory/overview` | `200 {"message":"Inventory overview fetched successfully.","data":{"total_sku_units":161950,"simple_units":161950,"variant_units":0,"totals_scope":"global","active_bins":12,"today_transactions":0,"warehouse_id":null}}` — **7th key `totals_scope` NOT in the Apidog doc** (drift-add) |
| 2 | `GET /admin/products/1682/placements` | **200** — global header (`sku:"KM_8767"`, authority 100, `available_quantity` computed, `variants: []`) + `placements: []` — empty set still 200 ✓ (authority stock can exist WITHOUT hint rows) |
| 3 | `DELETE /admin/locations/999999/products` | `404 {"message":"Resource Not Found","status":false}` ✓ fixed string |
| 4 | `DELETE /admin/locations/abc/products` | `404 {"message":"The route api/v1/admin/locations/abc/products could not be found.","status":false}` — raw route-miss passthrough (doc's `"Not Found"` = illustrative-only; same drift family as catch D9) |
| 5 | `DELETE` **no token** | `401 {"message":"غير مصرح. يرجى تسجيل الدخول.","status":false}` — **Arabic**, NOT the doc's `"Unauthenticated."` (period); same locale-translation behavior proven on every WMS route |
| 6 | `GET /admin/locations?limit=20` | 12 seed bins (A-01…PACK-01, ids 1–11, `barcode` populated on 8–12) + id 12 untyped/active |

## Mutation round (approved; disposable bin created and deleted)

| # | Probe | Live result |
|---|---|---|
| M1 | Create bin `VERIFY-EMPTY-1` (wh1, storage) | **201** → id **13** (status `null` — locations create quirk holds on meem too) |
| M2 | `POST /admin/locations/13/stock-receipts {product_id:1682, quantity:1, ref:"VERIFY-EMPTY-001", idempotency_key:"verify-empty-001"}` | **201** — authority 100→101; `placement {id:5, location_id:13, quantity:1, allocated_hint:0}`; resource RICHER than catch's (top-level + per-placement `product_variant_id` and `sku`) |
| M3 | `DELETE /admin/locations/13/products` (stocked) | **422** `{"message":"Cannot empty location #13: location holds physical stock. Transfer or consume stock first.","status":false,"success":false}` — verbatim literal WITH id, flat 422 envelope carrying `status`+`success` keys (matches `unprocessable()`-via-apiResponse shape claimed in doc — UNLIKE other family 422s that omit them) |
| M4 | `POST /admin/stock-transfers {product_id:1682, 13→2, quantity:1, key:"verify-empty-xfer"}` | **201** — total invariance 101→101; source row kept at `quantity: 0` (id 5), destination row created (id 6 @ bin 2, double-check of the placement family) |
| M5 | `DELETE /admin/locations/13/products` (drained) | **200** `"Location emptied successfully."` + truthful `{location_id:13, warehouse_id:1, removed:1, removed_ids:[5], remaining:0}` ✓ |
| M6 | `DELETE` again (idempotent replay) | **200** `"Location is already empty."` + `{removed:0, removed_ids:[], remaining:0}` ✓ |
| M7 | Cleanup `DELETE /admin/locations/13` + index sweep | bin deleted, **zero VERIFY residue** in the locations list |

## Residual live state (approved mutations)

- Product 1682 (Family Ship container) authority stock: **101** (was 100) — the received unit transferred into bin 2 (A-02) and stays.
- Placement rows: id 6 @ bin 2 (qty 1) — bin 13 and its rows (id 5) fully removed.
- Ledger keys left: `verify-empty-001`, `verify-empty-xfer`.

## CMS integration shipped with this round

- **Inventory page stats bar** now renders `GET /admin/inventory/overview` (Total SKU units / Active bins / Today's transactions); client-side derivations retired.
- **Transfer stock modal step 2** loads `GET /admin/products/{id}/placements` — source list = the product's actual placements with informational quantity (`· N in bin`, dedup on `allocated_hint`), falling back to the full bin list when the product has no hint rows.
- **Location detail page** gained the gated **Empty bin** action (manage-location; destructive AlertDialog with refusal box + truthful result card `/already-empty` variant).
- Hook layer: `useInventoryOverview`, `useProductPlacements`, `useEmptyLocation` (queries under `inventory.all` → auto-invalidated by receipts/transfers/empty).

## Unverified (left open)

- 422 guard paths needing fixtures: open picking tasks / unpicked commitment / pending return / picking-history refusals (service texts from the doc, code-traced only) + the 403 catalogue-shape `"This action is unauthorized."` scope mapping (needs a non-manage-location holder).
- `?product_variant_id` narrow + variant rows (no variant products in scope live).
- The doc's flagged evidence conflict (scoped caller + foreign `?warehouse_id`: test asserts 404, code ignores the filter) — irrelevant to global CMS holders; keep an eye if scoped roles are introduced.
- Product representability (variant) placement rows — none exist live yet.
