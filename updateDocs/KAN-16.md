# KAN-16: Promotions (Verification)

## Status
The promotions module was **already fully implemented** prior to this task. Verified all 13 files exist and all API endpoints work correctly.

## Existing Implementation
- **Types**: Promotion, PromotionImage, GiftProductInput, CreatePromotionData, UpdatePromotionData, full API response types
- **Schema**: Zod validation with conditional rules (type=price → min order required, typeAmount=percentage → max discount required, applyTo=specific_products → products required), toApiFormat mapper, defaults
- **API**: fetchPromotions, fetchPromotionById, createPromotion (FormData), updatePromotion (FormData + PUT), deletePromotion, searchProducts
- **Hooks**: usePromotions, usePromotion, useCreatePromotion, useUpdatePromotion, useDeletePromotion, useProductSearch
- **Page**: PromotionsPage with search, type filter (price/quantity), typeAmount filter (fixed_rate/percentage/gift), sort by, pagination (10/15/25/50)
- **Table**: Responsive desktop table + mobile cards, skeleton loading, empty state, dropdown actions (edit/delete)
- **Form dialog**: Create/Edit with translatable name (en/ar), conditional fields (percentage shows max discount, price shows min order, quantity shows required qty, gift shows gift products), image uploads (desktop + mobile), product multi-select (with search dropdown), gift product configuration (search + select + quantity), date pickers, status toggle, 422 error handling
- **Delete dialog**: Confirmation with promotion name and non-reversible warning
- **Status badge**: Green (active) / Red (inactive)
- **Image cell**: Desktop/mobile image with fallback icon
- **Route**: `/promotions` (lazy imported in App.tsx)
- **Permissions**: view/create/update/delete constants
- **i18n**: Full EN/AR keys for promotions page and form

## Verified APIs
- `GET /api/v1/promotions?limit=3` — ✅ Returns paginated list with 20 items
- `GET /api/v1/promotions/1` — ✅ Returns full detail with name parsed as JSON string
- `PUT /api/v1/promotions/1` (JSON body) — ✅ Updates promotion correctly
- `POST /api/v1/promotions` — ✅ Returns 422 validation errors (image required, min order required)

## API Bugs
- None found.
