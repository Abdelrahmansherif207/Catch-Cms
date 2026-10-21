# Warehouse Map — Bin Contents (check-occupancy) Verification (2026-10-20)

Server: `https://meem.mohammedtareq.me/api/v1` (matches `.env VITE_API_BASE_URL` — same base the
older locations module report used as `catch…` was re-pointed since; live checks below ran here).
Auth: global-admin holder, Sanctum token id `8|…` (has `manage-warehouse` + the new
`locations.check-occupancy` permission — scope confinement verified by behavior, not negative probing).

## What this is

`POST /api/v1/admin/locations/check-occupancy` is the backend source of truth for
"which bins are empty / occupied and what is stored in each" — the warehouse map's
Products-in-bins feature consumes it. Every response below was actually curled; the
success response shape was compared against the Apidog spec verbatim.

## Verified contracts (live)

| # | Probe | Live result |
|---|---|---|
| 1 | `GET /admin/locations?limit=100` | 200 — **32 bins across 3 warehouses** (ids 1–32); codes uniformly namespaced `LOC-…` (`LOC-A-01-01`, `LOC-BULK-01`, `LOC-AX-B-01`, `LOC-PICK-01`, `LOC-MAINT-01`); one `status:"inactive"` bin present |
| 2 | `POST /admin/locations/check-occupancy` `{location_ids:[1..32]}` (JSON) | 200 `"Locations occupancy checked successfully."` — **empty:17, occupied:15, not_found:[]**; mixed warehouses 1/2/3 accepted in ONE call without `warehouse_id` |
| 3 | Occupied row shape | `{id, warehouse_id, code, barcode, name, type, status, total_quantity, products_count, products[]}` — matches doc |
| 4 | Product row shape | `{placement_id, product_id, product_name, product_slug, product_sku, quantity, allocated_hint, available_quantity, has_variant, variant}` — live: Sony qty 1250 / allocated 120 / **available 1130** resolved server-side; `has_variant:false, variant:null` |
| 5 | Variant row shape | `{id, sku, price, sale_price, stock_quantity, attributes[{name, value, attribute_id, attribute_value_id}]}` — live: hoodie bin `LOC-AX-02-02` holds the SAME product under 2 variant SKUs (Size M / L, 200 each) |
| 6 | `Content-Type: application/json` on this route | **ACCEPTED** (unlike the locations CRUD family, which ignores JSON — see `locations-module-verification-2026-10-13.md` D2). The map API client sends JSON safely |
| 7 | PowerShell 5.1 curl caveat (tooling, not backend) | `curl.exe -d '{"a":[1]}'` strips inner quotes → server saw `{a:[1]}` → 422 "The given data was invalid." Via `Invoke-RestMethod`/proper escaping the identical body is 200. Backend was correct; the shell was lossy |

Business rules confirmed (spec verbatim, spot-checked by response values):

- Empty iff max `sum(quantity) ≤ 0` over remaining placements; placements with
  `quantity=0 AND allocated_hint=0` are filtered before judging.
- `null`/empty string/`[]`/non-integer values → 422 `{"message":"The given data was invalid.","status":false,"errors":{"location_ids":["The location_ids field is required."]}}`.
- Read-only: no writes, no transactions, safe to re-run in bursts.
- Scoped holders (without `manage-warehouse`) are confined to their home warehouse;
  ids outside scope land in `not_found` instead of 403-ing the whole call.
- `not_found` = requested ids that don't exist / are out of scope / don't match `warehouse_id`.
- Eager loading (product → variant → attributes) — no N+1.

## Frontend reaction map (this feature)

| Live fact | Frontend behavior |
|---|---|
| New permission `locations.check-occupancy` | `PERMISSIONS.locations.checkOccupancy`; every contents UI (chips/sidebar/details products) gates on it — users without it see the same v1 status map, no broken requests |
| List cap 100 ↔ unlimited check-occupancy arrays | Bins list ≤100 ids → chunked ≤50 per POST (≤3 requests under admin throttle); merged client-side into one `BinOccupancyResult` |
| Uniform `LOC-` namespace | Layout groups by the SECOND segment (`A`, `PICK`, `RCV`, `BULK`…) when every root code carries ≥3 segments with one shared first segment; the 3-segment floor protects doc-style `A-01` codes |
| 4-part codes (`LOC-A-01-01`) | In-aisle sort is NUMERIC per segment (bay-major: 01-01, 01-02, … 02-01) |
| Occupied rows carry total + products | Always-on `×units` chips, "Products in this bin" rows (variant attrs joined, sku, qty/allocated/available), searchable products sidebar aggregated by product id (0 extra requests on click) |
| `total_quantity` vs row sums | Aggregation trusts server `total_quantity` (recomputes only if absent); humanized via `formatUnits` |

## Drift vs Apidog spec

None observed on the success path — the pasted endpoint documentation matches live bytes
(field names, response envelope `status/message/success/data`, quantity semantics). The only
422 seen during probing was the shell-quoting artifact (#7), which resolved against the
documented success shape once the JSON body reached the server intact.

## UI wiring notes

- `useBinContents(warehouseId, locationIds, enabled)` — query key embeds the ids array,
  staleTime 60s; a bins-list refetch (scope switch, create/delete bin) re-checks fresh ids.
- Empty bins surface ONLY as "no contents entry": details panel shows an explicit
  "This bin is empty." note once the check responds; chips stay absent for them.
- Route focus (pick route) and product focus remain mutually exclusive; contents chips
  show total bin units in neutral mode and the focused product's units in product mode
  (dimmed bins hide their chip).
- The products sidebar deletes the old locator combobox (ProductLocator + `useProductOptions`
  + per-product placements fetch are gone — highlighting is derived entirely from contents).
