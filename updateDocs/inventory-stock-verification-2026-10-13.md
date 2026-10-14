# Inventory Stock Receipts & Transfers — Real-Behavior Verification Report (2026-10-13)

Server: `https://catch.mohammedtareq.me/api/v1`
Auth: token `19|…` (admin holder with locations/warehouses scope; lacked `view-products` — probed products via the public catalog)

## What this is

Two new WMS write endpoints integrated into the CMS:

- `POST /api/v1/admin/locations/{location}/stock-receipts` — receive stock at a bin
- `POST /api/v1/admin/stock-transfers` — move stock between same-warehouse bins

Every response below was **actually curled** — nothing guessed. The two mutating
probes (receipt + transfer, qty 1 each) were explicitly approved for this round.
Residual live state is listed at the end.

## Live data map at probe time

- Warehouse 1 — **TRASHED** (absent from `GET /admin/warehouses`) → locations 1–11 masked
- Warehouse 2 — active (`is_default`), locations 16 (storage), 17 (storage, child of 16)
- Warehouse 3 — active, location 15 (staging)
- Products (public catalog): id 1 Headset Alpha / id 2 Mouse Beta / id 3 Keyboard Gamma — all simple, `item_type: PHYSICAL`
- No `has_variants`/digital products exist on catch → representability guard unprovable live

## Probe matrix (phase 1 — zero mutation)

| # | Probe | Result |
|---|---|---|
| 1 | Receipt, no token | `401 {"message":"غير مصرح. يرجى تسجيل الدخول.","status":false}` — **Arabic**, not "Unauthenticated" |
| 2 | Receipt, JSON `{quantity:0}` | `422 {"errors":{"quantity":["The quantity must be at least 1."]}}` → **JSON bodies ARE parsed** (locations-create drift D2 does NOT apply here) |
| 3 | Receipt, urlencoded `{product_id:999999, quantity:0}` | `422 {"errors":{"product_id":["The selected product is invalid."], "quantity":["The quantity must be at least 1."]}}` — form path works; unknown ids 422 at **validation**; `product_id` label renders as **"product"** |
| 4 | Receipt, `/locations/abc/stock-receipts` | `404 {"message":"The route api/v1/admin/locations/abc/stock-receipts could not be found.","status":false}` |
| 5 | Receipt, valid body + unknown path id 999999 | `404 {"message":"Location not found.","status":false}` ✓ translated `wms.stock.location_not_found` |
| 6 | Transfer, JSON `{quantity:0}` | `422` per-field quantity error → JSON parsed on this route family too |
| 7 | Transfer `16→16` (max-int qty) | `422 {"message":"Source and destination locations must differ.","status":false}` — flat, no errors map |
| 8 | Transfer `16→1` (wh2→wh1) | `404 {"message":"Location not found.","status":false}` — location 1 provably exists; masked |
| 9 | Transfer `1→2` | `404` again → whole wh1 masked (trashed parent, NOT token scope) |
| 10 | Transfer `16→17` any of products 1/2/3 | `422 {"message":"No stock of product #N is placed at location #16.","status":false}` — no_stock literal with ids |
| 11 | Transfer `15→16` (wh3→wh2) | `422 {"message":"Cross-warehouse transfers are not supported: move stock within one warehouse.","status":false}` — both locations resolved first |
| 12 | `GET /products` (admin) with this token | `403 {"message":"User does not have the required permissions.","status":false}` |
| 13 | Receipt to trashed-wh bin **via resolved placeability path** — n/a | see #9 (transfer twin proves the family) |

Corollary: transfer/other-family resolution resolves locations through their
parent warehouse row — a soft-deleted warehouse 404s all of its bins.
The locations **index** is not warehouse-joined (it still lists bins 1–11).

## Guard-literal round (phase 2 — reversible, disposable bins created+deleted)

| # | Probe | Result |
|---|---|---|
| G1 | Created bin id 18, type `quarantine` (wh2) → receipt | `422 {"message":"Location #18 (type quarantine) is not placeable.","status":false}` |
| G2 | Created bin id 19, type `storage` → deactivated → receipt | `422 {"message":"Location #19 is not active and cannot receive stock.","status":false}` |
| G3 | `DELETE /admin/locations/18`, `/19` | both `200` — zero residue |

Note: a freshly created bin arrives with `status: null` (locations quirk); the
`deactivate` command is what produces a real `inactive`. The receipts guard keys
off the live status/placeability rules exactly as documented.

## Success round (phase 3 — mutating, approved)

| # | Probe | Result |
|---|---|---|
| S1 | `POST /admin/locations/16/stock-receipts {product_id:2, quantity:1, reference:"VERIFY-RCV-001", idempotency_key:"verify-rcv-001"}` | **201** `{"message":"Stock received successfully.","data":{"operation":{"product_id":2,"warehouse_id":2,"stock_quantity":101,"reserved_quantity":0,"available_quantity":101,"in_stock":true,"received_quantity":1,"transferred_quantity":null,"placement":{"id":5,"product_id":2,"location_id":16,"warehouse_id":2,"quantity":1,"allocated_hint":0},"source_placement":null,"destination_placement":null,"reference":"VERIFY-RCV-001"},"replayed":false}}` — authority 100→101 |
| S2 | Same call, same key (replay) | **200** `{"message":"Stock receipt already processed.","data":{same operation, "replayed":true}}` — identity hold at 101; single ledger row |
| S3 | Transfer `16→17` qty 2147483647 | `422 {"message":"Insufficient transferable stock at location #16: available 1, requested 2147483647.","status":false}` — live figures in text |
| S4 | `POST /admin/stock-transfers {product_id:2, 16→17, quantity:1, reference:"VERIFY-XFER-001", idempotency_key:"verify-xfer-001"}` | **201** `{"message":"Stock transferred successfully.","data":{"operation":{"product_id":2,"warehouse_id":2,"stock_quantity":101,"reserved_quantity":0,"available_quantity":null,"in_stock":null,"received_quantity":null,"transferred_quantity":1,"placement":null,"source_placement":{id:5,quantity:0},"destination_placement":{id:7,location_id:17,quantity:1},"reference":"VERIFY-XFER-001"},"replayed":false}}` — **total invariance 101→101**, source drained, destination row created |
| S5 | Same transfer call, same key (replay) | **200** `{"message":"Stock transfer already processed.","data":{same, "replayed":true}}` |
| S6 | Cross-check catalog | `GET /general/products/wms-smart-mouse-beta` → `quantity: 101`, `in_stock: 1` ✓ |

### Payload-shape findings (success responses)

- Receipts: `placement` = the destination placement row `{id, product_id, location_id, warehouse_id, quantity, allocated_hint}`; `available_quantity`/`in_stock` are live numbers.
- Transfers: `placement` is `null`; `source_placement`/`destination_placement` snapshots returned (source row shows `quantity: 0` after drain — the row is kept, not deleted); **`available_quantity` and `in_stock` are `null` on transfers** (nullable in TS types).
- Message pairs confirmed: `Stock received successfully.` / `Stock receipt already processed.` and `Stock transferred successfully.` / `Stock transfer already processed.`

## Drift vs Apidog docs (live-verified corrections)

| # | Doc claim | Actual (catch) |
|---|---|---|
| D1 | 401 `"Unauthenticated"` | **Arabic** `"غير مصرح. يرجى تسجيل الدخول."` |
| D2 | validation literal `"The quantity field must be at least 1."` | `"The quantity must be at least 1."` (no "field" on min-rule; present on required-rule, e.g. `"The product field is required."`); `product_id` label = **"product"** |
| D3 | non-numeric `{location}` → `"Not Found"` | `"The route api/v1/admin/locations/abc/stock-receipts could not be found."` |
| D4 | out-of-scope → verbatim 403 `"Forbidden warehouse operation."` | not reachable with a global-ish token; foreign/missing bins surface as `404 Location not found.` (anti-enumeration style) — arbitrary; untested for scoped holders |
| D5 | transfer response `available_quantity: 150` (number) | **null** on transfers (and `in_stock: null`) |
| D6 | Var "authority" split claims per-location splits | consistent live (101 invariant across S1/S4/S5) |

Also verified-consistent with doc: JSON bodies parsed (BOTH content types accepted),
201/200 envelopes, replay semantics (200 + `replayed:true`, identity held),
no_stock/insufficient/placability guards. Rate limit observed `X-RateLimit-Limit: 60`
per minute (same family as the locations routes — doc claimed 400/min).

## Unverified (couldn't probe live)

- **403 warehouse-scope literal** for a scoped holder (token is global-ish; foreign
  warehouses were only reachable as trashed-wh 404s).
- **Product representability guard** (variable-with-variants / digital → 422) — no such
  product exists on catch.
- **429 body** for `throttle:admin` on these routes (60/min limiter; not hammered).

## Residual live state (approved mutations)

- Product 2 (Mouse Beta) authority stock: **101** (was 100) — receipt qty 1 is permanent.
- Placement rows: id 5 @ location 16 (`quantity: 0`, drained by the transfer), id 7 @ location 17 (`quantity: 1`).
- Locations 18/19 created and hard-deleted — zero residue.
- Idempotency ledger keys left: `verify-rcv-001`, `verify-xfer-001`.

---

# Addendum — same day, re-seeded dataset (CMS bug report: "Receive dialog shows no locations")

## Environment change caught live

Between the morning sandbox round and the CMS test the catch DB was **re-seeded
with production-like data**: warehouses list collapsed to ONE (`id 1, "Irma
Larsen", active, default`), locations to ONE (`id 1 "Acton Mcclure", wh1,
**type: null**, status active`), catalog to 3156 real products (Mesauda…).
Token `19|…` vanished (401 unstated) — probes migrated to fresh token `5|…`.

## Root cause of the empty bin select (CMS bug)

The two dialogs' bin filter was:

```
status === 'active' && type !== null && type ∈ {receiving,storage,picking,packing,staging}
```

Both halves are stricter than the BACKEND:

1. **type-null exclusion** — false: receipts accept untyped bins. LIVE PROOF:
   `POST /admin/locations/1/stock-receipts {product_id: 4100, quantity: 1,
   reference: "VERIFY-NULLTYPE-001", idempotency_key: "verify-nulltype-001"}`
   → **201** `"Stock received successfully."` authority 10→11,
   `placement {id: 2, product_id: 4100, location_id: 1, warehouse_id: 1,
   quantity: 1, allocated_hint: 0}` (null-type bin, active status).
2. **status === 'active' exclusion** — false for status-null bins: locations
   create stores bins with `status: null` (quirk D3/D6 of the locations module)
   and nothing in the receipts guard text denies them; only an explicit
   `inactive` refuses (G2 literal). Untested-null was excluded from the picker
   without evidence.

## Fix shipped (frontend)

- `NON_PLACEABLE_LOCATION_TYPES = ['quarantine','damaged','returns']` +
  shared `isStockCapableBin()` in `features/inventory/types` — the picker
  excludes ONLY bins the backend is PROVEN to refuse (inactive; the three
  types). Status-null and untyped bins stay selectable; the endpoint's
  verbatim 422 remains the authority.
- Applied in `receive-stock-dialog.tsx` + `transfer-stock-dialog.tsx`
  (destination keeps same-warehouse + ≠source narrowing).
- i18n copy updated (receiveNote/transferNote EN+AR) to stop naming a
  whitelist of types.
- `npm run build` ✅ · `npm run lint` ✅ (only the 2 pre-existing repo errors).

## Addendum residual state

- Product 4100 authority: **11** (was 10) — null-type receipt qty 1 permanent.
- Placement row: id 2 @ location 1 (quantity 1).
- Ledger keys left: `verify-nulltype-001`.
- Backend verdict recorded: **untyped bins are RECEIVABLE**.

## Updated unverified list (post-addendum)

- The receipts guard for status-null bins remains empirically untested via the
  API (the CMS-created bin path suggests it passes; the picker no longer
  presumes either way).
- 403 warehouse-scope literal, product representability guard, 429 body — as before.
