# KAN-15: Flash Sale (Verification)

## Status
The flash-sale module was **already fully implemented** prior to this task. Verified all components exist and all API endpoints work correctly.

## Existing Implementation
- **Types**: FlashSale, FlashSaleImage, FlashSaleProduct, CreateFlashSaleData, UpdateFlashSaleData
- **Schema**: Zod validation with form defaults and toApiFormat mapper
- **API**: fetchFlashSales, fetchFlashSaleById, createFlashSale (FormData), updateFlashSale (FormData + PUT), deleteFlashSale, reorderFlashSales, searchProducts
- **Hooks**: useFlashSales, useFlashSale, useCreateFlashSale, useUpdateFlashSale, useDeleteFlashSale, useReorderFlashSales (with optimistic updates), useProductSearch
- **Page**: FlashSalePage with search, sort by (ID/title/created_at), direction (asc/desc), per-page selector, pagination
- **Table**: Responsive desktop table / mobile cards with reorder (move up/down), edit, delete actions
- **Form dialog**: Create/Edit with title (en/ar), description (en/ar), date pickers, discount type (percentage/fixed_rate/final_price), discount amount, max discount (shown for percentage), image uploads (desktop + mobile) with preview, product multi-select with search
- **Delete dialog**: Confirmation with review
- **Status badge**: Green (active) / Red (inactive)
- **Image cell**: Thumbnail with fallback icon

## Verified APIs
- `GET /api/v1/flash-sale?limit=3` — ✅ Returns paginated list with 10 items
- `GET /api/v1/flash-sale/1` — ✅ Returns full detail with products
- `PUT /api/v1/flash-sale/1` (JSON body) — ✅ Updates flash sale correctly
- `PUT /api/v1/flash-sale/reorder` — ✅ Reorders successfully

## API Bugs
- None found.
