# Rebuild the homepage into a curated, best-practice ecommerce section set (via API curl)

## Context (from exploration)

- This repo is the **React CMS frontend only**; all data lives on the remote API `https://meem.mohammedtareq.me/api/v1` (`.env` `VITE_API_BASE_URL`). The storefront is the Next.js app at `https://mohammedtareq.me`, whose public homepage is `GET /general/content-pages/home`. So the entire task is authenticated curl calls against the API.
- **Auth**: `POST /admin-login` `{"email":"admin@demo.com","password":"password"}` → `data.token` (Bearer). All section calls need headers `Authorization: Bearer <token>`, `Accept: application/json`, `lang: en`.
- **Section API**: `GET/POST /sections`, `PUT /sections/{id}` (update), `DELETE /sections/{id}`, `PATCH /sections/{id}/toggle-active`, `PUT /sections/reorder` with `{ "sections": [all ids in order] }`.
- **Payload shapes**: create = `{type, title:{en,ar}, endpoint:"", is_active:1, title_visible:1, setting:{front:{...},back:{...}}}`; update = `{title, is_active, title_visible, setting}` (type can't change). `is_active`/`title_visible` are integers 1/0; title ≤50 chars in both locales. Backend generates the public `endpoint` from `setting.back`.
- **Storefront renders only**: `sliders`, `banners`, `promotions`, `flash-sales`, `categories`, `products`, `brands`, `coupons`. The seeded `tags` section is **un-renderable** (storefront logs "Unknown section type"). A section only appears on the storefront if its generated endpoint returns non-empty data — final verification will curl every section endpoint.

## Current state: 21 live sections, mostly dummy

Problems: 5 near-duplicate flash-sale product sections (ids 9,10,11 + flash-sales 6), 2 category sections (5, 17), 2 discount sections (14, 15), odd sections (12 `brands_product`, 16 `product_for_parent_category`), a dead `tags` section (4), a **broken banner** (23 — null title, empty settings `[]`), and "Best Product Sales" (7) misconfigured with `order_price: asc`. Generic titles ("Sliders", "Banners", "Promotions").

## Target homepage blueprint (11–12 curated sections, all 8 types)

| # | Type | Existing id | Title (en / ar) | Curated settings | Best-practice rationale |
|---|------|----|-----------------|------------------|-------------------------|
| 1 | sliders | 1 | Featured Collections / مجموعات مميزة | keep best slider slug (verify via GET /sliders) | Hero story first |
| 2 | categories | 5 | Shop by Category / تسوق حسب الفئة | shape circle, columns 8, real parent-category IDs (max 8) | Fast navigation |
| 3 | flash-sales | 6 | Flash Deals / عروض خاطفة | show_timer + theme colorful, only currently-valid flash-sale IDs, limit 10 | Urgency early |
| 4 | products | 8 | New Arrivals / وصل حديثاً | template `new_arrivals`, limit 10, badge NEW (already good — verify) | Freshness |
| 5 | banners | 2 | Summer Sale / تخفيضات الصيف | slug summer-sale, with_products true, columns 5 | Campaign moment #1 |
| 6 | products | 7 | Best Sellers / الأكثر مبيعاً | fix: limit 10, order desc (drop `order_price: asc`) | Social proof |
| 7 | promotions | 3 | Special Offers / عروض خاصة | grid, columns 3, valid promotion IDs, limit 6 | Value props |
| 8 | banners | 23 | Back to School / العودة للمدارس | **repair** broken empty settings → columns 5, slug back-to-school, with_products true | Campaign moment #2 |
| 9 | products | 15 | Deals & Discounts / التخفيضات | template `all_product_discounts`, badge SALE, limit 10 | Deal hunters |
| 10 | brands | 13 | Top Brands / أفضل الماركات | curated brand IDs, grid, limit 10 | Trust/authority |
| 11 | coupons | 18 | Coupons & Vouchers / كوبونات الخصم | grid, columns 3, valid coupon IDs | Conversion nudge before footer |
| 12 | banners | new | TBD by found slug | only if `GET /banners` reveals a 3rd distinct usable slug — one pre-footer campaign banner | "Banners used more, carefully": 2–3 strategic placements, never spam |

## Cleanup — delete 8 redundant/dummy sections

DELETE ids: **4** (tags — unrenderable), **9, 10, 11** (flash-sale product duplicates), **12** (brands_product oddity), **14** (low-stock discount dup), **16** (product_for_parent oddity), **17** (duplicate category section). If any DELETE unexpectedly fails server-side, fall back to `PATCH /sections/{id}/toggle-active` for that id and note it.

## Execution steps

1. **Login** → capture token. 2. **Backup**: `GET /sections` → save full JSON to `updateDocs/homepage-sections-backup-2026-08-30.json` (rollback reference for the deletions). 3. **Recon**: GET `/banners`, `/sliders`, `/flash-sale`, `/coupons`, `/promotions`, `/brands`, `/categories`, `/product-type` → collect real IDs/slugs, filter to valid/current entities; adjust blueprint to what actually exists (e.g. if no back-to-school banner entity exists, repoint or drop row 12). 4. **Update** the 10 keeper sections via `PUT /sections/{id}` with full curated payloads. 5. **Delete** the 8 junk ids. 6. **Create** the conditional 3rd banner section if applicable. 7. **Reorder**: `PUT /sections/reorder` with the complete ordered id list of all remaining sections. 8. **Verify**: `GET /sections` (order/active/titles), public `GET /general/content-pages/home` (curated set, correct order), and curl **each section's generated endpoint** to confirm non-empty data — fix any empty section (repoint IDs/limit) or deactivate it. 9. Report the final homepage blueprint, every change made, and verification results.

## Safety

Read-only recon first; mutations touch only `/sections` endpoints (no other CMS data). Local JSON backup before any mutation. Stop and report on unexpected 5xx instead of retrying against the live server.