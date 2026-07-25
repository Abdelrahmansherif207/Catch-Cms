# KAN-19: Sliders (Verification)

## Status
The sliders module was **already fully implemented** prior to this task. Fixed one bug (product chip index mismatch). Verified all APIs.

## Changes Made
- **Fixed product chip index mismatch bug** in `slider-form-dialog.tsx`: `selectedProductNames` was derived from `availableProducts` (current search results), causing missing/inaccurate product names for pre-loaded products in edit mode. Changed to use a `productNames` state map (`Record<number, string>`) that persists independently of search results. Chips now iterate over `selectedProductIds` directly instead of relying on index alignment.

## Existing Implementation
- **Types**: Slider, SliderImage, SliderProduct, full API response types, ChangeStatusResponse
- **Schema**: Zod validation with multilingual title, `toApiFormat` mapper, defaults
- **API**: fetchSliders, fetchSliderById, createSlider (FormData), updateSlider (FormData + PUT), deleteSlider, changeSliderStatus (PATCH), reorderSliders (PUT), searchProducts
- **Hooks**: useSliders, useSlider, useCreateSlider, useUpdateSlider, useDeleteSlider, useChangeSliderStatus (optimistic), useReorderSliders (optimistic), useProductSearch
- **Page**: SlidersPage with active/inactive filter, sort (order/title/created_at/status), direction (asc/desc), pagination (10/15/25/50), refresh button
- **Table**: Full dnd-kit drag-and-drop reorder with SortableRow, GripVertical handle, inline Power/PowerOff status toggle confirmation, edit/delete dropdown
- **Form dialog**: Create/Edit with multilingual title (en/ar), image uploads (desktop + mobile), status toggle, product multi-select with search dropdown and chips
- **Delete dialog**: Confirmation with slider name
- **Status badge**: Green (active) / Red (inactive)
- **Image cell**: Desktop/mobile image with dashed placeholder
- **Route**: `/sliders` (not yet registered in App.tsx)
- **i18n**: Full EN/AR keys

## Verified APIs
- `GET /api/v1/sliders?limit=3` — ✅ Returns paginated list (10 items)
- `GET /api/v1/sliders/1` — ✅ Returns detail with parsed title + products array
- `PUT /api/v1/sliders/1` (JSON body) — ✅ Updates slider correctly
- `PATCH /api/v1/sliders/change-status` — ✅ Toggles status (returns full data with products)
- `PUT /api/v1/sliders/reorder` — ✅ Reorders successfully

## API Notes
- `change-status` uses **PATCH** (not POST as initially assumed) — frontend correctly uses `axiosClient.patch`
- Change-status response returns full slider detail including all associated products
- Slider detail response includes `products` array with `id`, `name`, `slug`, `status`, `image.thumbnail`

## API Bugs
- None found.
