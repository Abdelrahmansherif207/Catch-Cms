# KAN-20: Admin Packing module (packing-tasks) — Verification

## Status
Packing module implemented (7 Admin Packing endpoints + the `create-packing-task` trigger) and verified against the live backend. TypeScript clean, ESLint 0 errors on touched files, `vite build` OK. Live curl smoke walk completed on two fulfillments (13, 6).

## Existing Implementation
New feature slice `src/features/packing-tasks/` (full mirror of `picking-tasks` architecture):

- **Types** — `PACKING_TASK_STATUSES` (pending/assigned/packing/packed/verified/cancelled), terminal helpers, `ASSIGNABLE/STARTABLE/PACKABLE/VERIFIABLE/CANCELLABLE` pools, list + detail interfaces (live-verified shapes), command payloads.
- **Routes** — `/packing-tasks`, `/packing-tasks/:id`.
- **API** — fetchPackingTasks (filters: warehouse_id/station_id/fulfillment_id/status/assigned_to/limit), fetchPackingTaskById, assignPackingTask {station_id}, startPackingTask (no body), packPackingTask {weight, dimensions, materials?, notes?}, verifyPackingTask {notes?}, cancelPackingTask {reason}. Plus `createPackingTaskForFulfillment` in `fulfillments.api` (POST /admin/fulfillments/{id}/create-packing-task).
- **Hooks** — usePackingTasks / usePackingTask / 5 command mutations; all invalidate `packingTasks` + `fulfillments` + (create) `packingTasks.all`.
- **Schemas** — zod: assign (station int ≥1), pack (weight >0, length/width/height numerics), verify (notes ≤2000), cancel (reason non-blank-after-trim, mirror of the service split); `parseMaterials` comma→array.
- **Components** — status badge (6 tones), list table (Task/Fulfillment/Station/Assignee/Status/Weight/Packed/Created/Actions), AssignPackingTaskDialog (active-station Select via packing-stations hook + manual id fallback — assignee is ALWAYS the caller server-side), PackPackingDialog, VerifyPackingDialog, CancelPackingTaskDialog.
- **Pages** — PackingTasksPage (Mine/All scope: NO `mine` server param — "My queue" = `assigned_to` = `/me` id, 10-min cached; status chips open/packed/verified/cancelled + exact status & station FilterSelects; raw-grants gating on `packing-execute`), PackingTaskDetailPage (numeric-id route guard, fulfillment enrichment via useFulfillment for number/warehouse/order chips, station card w/ "No station" warning, action deck per state with permission splits assign/start `packing-execute`, pack/verify `packing.complete` raw-gated, cancel `manage-fulfillment`, lifecycle card, pack-details card).
- **Wiring** — App.tsx routes gated `PERMISSIONS.fulfillments.view`; sidebar entry after Picking Tasks (`fulfillments.view`); fulfillment detail page: **"Start Packing" button beside Assign** (status `picked` + `can('packing-execute')`), PackingTasksMiniTable linking to the pack screen.
- **Permissions** — added to PERMISSIONS.fulfillments: `packingExecute: 'packing-execute'`, `packingComplete: 'packing.complete'` (dot convention mirrors `fulfillment.create`).
- **i18n** — full `packingTasks.*` sections (en + ar), `sidebar.packingTasks`, `fulfillments.startPacking/startingPacking/packingTaskStarted/packingTaskError/viewPackingTask`.

## Verified APIs (live curl)
- `GET /admin/packing-tasks` — 200 flat array; filters **status / assigned_to / station_id** all confirmed live with rows.
- `GET /admin/packing-tasks/1` — 200 detail; `station: null` when unassigned (not absent); NO fulfillment/order refs on the task resource (detail page enriches via GET /admin/fulfillments/{id}).
- `GET /admin/packing-tasks/999` — 404 fixed "Resource Not Found".
- `POST /admin/packing-tasks/{id}/assign {station_id}` — 200, caller pinned (user 1 from token 10), station block `{id, code, name, warehouse_id}` (no status key); bad body → 422 errors map with attribute label **"The station field is required."** (not "station id").
- `POST .../start` — 200 `packing` + started_at; restart/pending start → 422 "Cannot start packing task in status: pending" (live).
- `POST .../pack {weight, dimensions, materials?, notes?}` — 200 `packed`; payload persists verbatim; fulfillment stays `packing` (live-checked both fixtures).
- `POST .../verify {notes?}` — 200 → task `verified` + fulfillment `ready_to_ship` (packing_completed_at + ready_to_ship_at stamped); WITHOUT a package → 422 **"Cannot verify packing: fulfillment item #5 picked 1, packed 0"** (live) — see Dependencies.
- `POST .../cancel {reason}` on a `packed` task — 422 "Cannot cancel packing task in status: packed" (live). Success path not exercised (would need a fresh pending/ assigned task; spec-only).
- `POST /admin/fulfillments/{id}/create-packing-task` — 201 fresh (fixture 13): task `pending`, fulfillment flips `picked → packing`, packing_started_at stamped. Second open task → 409 with live engine text **"Fulfillment #6 already has an open packing task"** (surfaced as UI toast verbatim).

Full happy path (fixture 13): create → assign(station 1) → start → pack(0.5 / 10×10×10) → verify → fulfillment 13 `ready_to_ship`. Fixture 6 left mid-flow: fulfillment `packing`, task #2 `packed` (awaiting packages surface).

## API Bugs / Quirks (behavioral, not blocking)
1. **Ghost station 422 leaks framework text** — assign with unknown station_id returns 422 as `{"message": "No query results for model […PackingStation] <id>", status:false}` (service lookup inside the swallowed try). UI shows it verbatim as a toast; backend follow-up mapped in its own doc.
2. **Assign validation attribute label is "station"** ("The station field is required.") — cosmetic; mirrors the server errors map as-is.
3. **Create scope 403 text differs**: create-packing-task scope guard responds verbatim `"Forbidden warehouse operation."` (per family docs) vs `"This action is unauthorized."` on the packing-tasks command group.
4. **No `mine` param** on the packing list (picking has one) — Mine tab compensates via `assigned_to`.

## Dependencies (follow-up slice)
- **Packages surface is REQUIRED for `verify` to ever succeed**: packages are never auto-created (proved: `packages: []` after create/assign/start/pack). Undocumented endpoints found by probing (OAS only carries `packages/{id}/add-item`): `POST /admin/packages {fulfillment_id}` → 201 open package (number `PCK-…`), `GET /admin/packages/{id}` (detail: barcode/weight/dimensions/notes/items[{id, fulfillment_item_id, order_item_id, quantity}]/sealed_at/handed_off_at), `GET /admin/packages?fulfillment_id=`, `POST /admin/packages/{id}/add-item {fulfillment_item_id, quantity}` (additive merge, over-pack 422s), `POST /admin/packages/{id}/seal` (generates `PKG-…` barcode + sealed_at; NOT auto-sealed on verify), `POST /admin/packages/{id}/void {reason}` (route + reason rule confirmed, service guards not live-tested). Next task: packages panel (create/add-item/seal/void) on the packing task detail + packages slice of the fulfillment detail.

## Notes
- Fixture states left behind: fulfillment 13 `ready_to_ship` (task verified, package 2 sealed), fulfillment 6 `packing` (task #2 packed).
- Verify will keep 422ing with the quantities text until the packages slice ships — the UI surfaces the server wording as the operator checklist.
