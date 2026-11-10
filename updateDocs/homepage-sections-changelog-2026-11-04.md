# Catch homepage section fix — 2026-11-04

Goal: make `catch.mohammedtareq.me` storefront render its home sections like `meem.mohammedtareq.me`.

## Root cause

All 17 public home sections returned HTTP 200, but 8 returned 0 items → the client hides empty sections.
Two causes:

1. **Date-window pins wiped populated data.** Sliders + brands sections had `back.start_date`/`back.end_date`
   (`2026-10-14 → 2026-11-14`) while the selected entities (`slidersId 4,1,2,3,5,7,8`, `brandsId 1–6`) do not
   fall in that window. Proven: same endpoints *without* dates returned 7 / 6 items.
2. **Missing content on Catch.** 0 records exist for promotions, tags, coupons, flash-sales (checked unfiltered),
   and the discount/new-arrivals product types have no matches.

## Changes applied (admin API)

Rollback: `updateDocs/homepage-sections-backup-2026-11-04.json`

| Section | Before (back) | After (back) |
|---|---|---|
| id 1 sliders | `start_date:2026-10-14, end_date:2026-11-14, limit:10, slidersId:[4,1,2,3,5,7,8], order:desc` | dates removed, rest identical |
| id 13 brands | `start_date:2026-10-14, end_date:2026-11-14, limit:10, brandsId:[1..6], order:desc` | dates removed, rest identical |

PUT payload shape that the API accepts: `{ title:{en,ar}, order, is_active:1, setting:{front,back} }`
(a plain string title / boolean is_active → 422).

Not modified: every other section (banners, categories, product sections) already works.

## Verification (public API, after change)

Populated sections: **9 / 17** (was 6 / 17)

| sec | type | count |
|---|---|---|
| 1 sliders | 7 ✅ | (was 0) |
| 2 banners winter-clearance | 1 ✅ | |
| 5 categories | 16 ✅ | |
| 7 best_product_sales | 20 ✅ | |
| 12 brands_product | 10 ✅ | |
| 13 brands | 6 ✅ | (was 0) |
| 14 discount_today_or_low_qty | 3 ✅ | |
| 16 product_for_parent | 10 ✅ | |
| 17 parent categories | 15 ✅ | |

## Still empty — needs real content in Catch CMS (not config)

| Section | Reason |
|---|---|
| 3 promotions | no promotions exist → create in CMS → Promotions |
| 4 tags | no tags exist → create in CMS → Tags, then re-select IDs in section |
| 6 flash-sales (currently `is_active:false`) | no flash sales exist → create in CMS → Flash Sale, then toggle section active |
| 8 new_arrivals | `type=new_arrivals` matches 0 products on this backend; unknown params are ignored (verified `new=1`, `discount_active=1`… all return the default list) → needs backend logic or a different data flag |
| 9/10/11 flash_sale product types | depend on existing flash sales |
| 15 all_product_discounts | no products with active discount window |
| 18 coupons | no coupons exist → create in CMS → Coupons |

Note: the products endpoint silently ignores unknown filters — tested, don't rely on it.
