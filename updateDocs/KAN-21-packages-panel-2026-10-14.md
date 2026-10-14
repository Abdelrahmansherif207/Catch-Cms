# KAN-21: Packages panel (add-item / seal / void) — Verification

## Status
Packages slice implemented on the packing task detail screen (plus slim rows on fulfillment detail) and verified against the live backend via curl sweep with token 11 (same Shop Owner, user 1). TypeScript clean, ESLint 0 errors on touched files, `vite build` OK.

## Existing Implementation
New feature slice `src/features/packages/`:

- **Types** — `PACKAGE_STATUSES` (open/sealed/voided/handed_off), `PackageListItem` (index: carries pre-counted `item_count`, NO items/notes/dimensions), `PackageDetail` (show: full `items[]` + barcode + sealed_at + handed_off_at + notes), payloads.
- **API** — fetchPackages (index, `fulfillment_id` REQUIRED server-side), fetchPackageById, createPackage {fulfillment_id}, addPackageItem {fulfillment_item_id, quantity}, sealPackage (EMPTY body — retained weight/dims; the pack step owns them per user direction), voidPackage {reason}.
- **Hooks** — invalidate `packages.all` + `fulfillments.all` (fulfillment payload embeds packages + verify math depends on them).
- **Schemas** — add-item (int > 0; remaining cap computed client-side, server over-pack remains authoritative), void reason non-blank-after-trim; `remainingToPack` helper = picked − Σ non-voided package_items.
- **Components** — PackageStatusBadge (4 tones), AddPackageItemDialog (item picker from the fulfillment items with picked/packed/remaining; quantity prefilled to remaining; over-pack превышает cap → client error + server 422 verbatim), VoidPackageDialog (manager-only, reason).
- **Panel** — `packing-tasks/components/packages-panel.tsx` mounted on the packing task detail (independent of task state; packages are fulfillment-scoped): rows (#/barcode/status/items/weight/sealed_at), "New package" disabled while a non-voided package exists (one-active rule — live 409 confirmed), open-package actions: Add item (packing-execute), Seal (enabled non-empty only — empty-seal 422 confirmed), Void (manage-fulfillment). Raw-grants gating on `packing-execute` / `manage-fulfillment`.
- **Fulfillment detail** — PackagesMiniTable (slim {id, packing_task_id, status, package_number} payload) with the shared status badge.
- **i18n** — full `packages.*` sections (en + ar).

## Verified APIs (live curl, token 11)
| Probe | Result |
| --- | --- |
| `POST /admin/packages {fulfillment_id}` | 201 `open` pkg (PCK-…), all-null optional fields |
| Second create while a non-voided package exists | **409** `"Fulfillment #12 already has an active package (one package per fulfillment)"` |
| Create after all packages voided | 201 — voided never blocks replacement |
| `GET /admin/packages?fulfillment_id=X` | flat rows `{id, fulfillment_id, packing_task_id, package_number, barcode, status, weight, item_count, sealed_at, …}` |
| `POST /packages/{id}/add-item` (exact qty) | 200 detail with `items[{id, fulfillment_item_id, order_item_id, quantity}]` (additive merge) |
| Over-pack | 422 `"Over-pack rejected: picked 2, already packed 2.00, requested 1"` |
| Seal non-empty `{}` | 200 `sealed` + auto-barcode `PKG-…` + `sealed_at` |
| Seal empty | 422 `"Cannot seal an empty package"` |
| Void open (even empty) | 200 `voided` + reason in `notes` (items retained) |
| Void sealed | 422 `"Cannot void package in status: sealed (only open packages may be voided)"` |
| Void replay | 422 `"Package #4 is already voided"` |
| Blank reason `' '` | validation 422 WITH errors map — global TrimStrings catalogs it before the service split |

## Behavior rules encoded
1. **One ACTIVE package per fulfillment** — active = non-voided (open or sealed both block a new create, 409).
2. **Void only open packages** — sealed custody never voided (422); voided rows keep items but they are excluded from verify math → those units count back into "remaining".
3. **Seal only non-empty** (422 otherwise); seal is manual — NOT auto on verify (seeded sealed packages predate verify).
4. **Remaining math**: picked − Σ non-voided package_items, per fulfillment item. The open package is the only live contributor under the one-active rule.

## Fixture states left
- Fulfillment 12 / task #3 `packed` + **sealed `PCK-20261014-BBF0CB`** (2/2 units) → Verify click should now SUCCEED (fulfillment → ready_to_ship).
- Fulfillment 6 / task #2 `packed` + **open `PCK-20261014-47665E`** (empty) → full UI walk: Add item (#5, qty 1) → Seal → Verify.
- Fulfillment 13 → ready_to_ship with sealed pkg 2 (earlier smoke).

## Notes
- `POST /admin/packages` and `GET /admin/packages/{id}` remain UNDOCUMENTED in the Apidog OAS (missing from the forensic merge) — verified live.
- Create-package route pipe permission unknown (not documented; probed with an all-permission holder). UI gates create/add/seal on `packing-execute`, void on `manage-fulfillment` — the server remains the source of truth (403 toast).
