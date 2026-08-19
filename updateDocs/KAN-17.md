# KAN-17: Coupons (Verification)

## Status
The coupons module was **already fully implemented** prior to this task. Added one missing feature (`free_shipping` discount type) and verified all APIs.

## Changes Made
- Added `free_shipping` option to discount type select in `coupon-form-dialog.tsx`
- Added conditional logic to hide discount field when `free_shipping` selected
- Updated schema `coupon.schema.ts` to make discount optional when `free_shipping`, with `superRefine` validation
- Updated `toCreateApiFormat`/`toUpdateApiFormat` to skip discount field for `free_shipping`
- Added i18n keys `freeShipping` in EN and AR translation files

## Existing Implementation
- **Types**: Coupon, CouponImage, CreateCouponData, UpdateCouponData, full API response types
- **Schema**: Zod validation with conditional refinements, toCreateApiFormat/toUpdateApiFormat mappers, defaults
- **API**: fetchCoupons, fetchCouponById, createCoupon (FormData), updateCoupon (FormData + PUT), deleteCoupon
- **Hooks**: useCoupons, useCoupon, useCreateCoupon, useUpdateCoupon, useDeleteCoupon
- **Page**: CouponsPage with search, status filter (all/active/inactive), sort (created_at/discount/start_date/end_date), direction (asc/desc), pagination (10/15/25/50)
- **Table**: Responsive desktop table + mobile cards, skeleton loading, empty state, dropdown actions (edit/delete)
- **Form dialog**: Create/Edit with translatable names (en/ar), conditional fields (percentage shows max discount, free_shipping hides discount), date pickers, usage limiter, border color input, borderless toggle, image uploads (desktop + mobile), status toggle, 422 error handling
- **Delete dialog**: Confirmation with coupon code
- **Status badge**: Green (active) / Red (inactive)
- **Image cell**: Desktop/mobile image with fallback icon
- **Route**: `/coupons` (lazy imported in App.tsx)
- **i18n**: Full EN/AR keys for coupons page and form

## Verified APIs
- `GET /api/v1/coupons?limit=3` — ✅ Returns paginated list with 20 items
- `GET /api/v1/coupons/1` — ✅ Returns full detail with name + code
- `PUT /api/v1/coupons/1` (JSON body) — ✅ Updates coupon correctly
- `POST /api/v1/coupons` — ✅ Returns 422 validation errors (images required, max discount required for percentage)

## API Bugs
- None found.
