# KAN-18: FAQs (Verification)

## Status
The FAQs module was **already fully implemented** prior to this task. Verified all 9 files exist and core CRUD APIs work. However, **3 API bugs** found.

## Existing Implementation
- **Types**: Faq, FaqsListOriginal, FaqsListResponse, FaqDetailResponse, CreateFaqData, UpdateFaqData
- **Schema**: Zod validation with multilingual fields, `toApiFormat` mapper
- **API**: fetchFaqs, fetchFaqById, createFaq (JSON body), updateFaq (JSON body), deleteFaq, reorderFaqs
- **Hooks**: useFaqs, useFaq, useCreateFaq, useUpdateFaq, useDeleteFaq, useReorderFaqs (with optimistic updates + rollback)
- **Page**: FaqsPage with search, sort (created_at/faq_title), direction (asc/desc), pagination (10/15/25/50)
- **Table**: Full dnd-kit drag-and-drop reorder with SortableRow, GripVertical handle, closestCenter collision, KeyboardSensor/PointerSensor, arrayMove, optimistic UI
- **Form dialog**: Create/Edit with multilingual title (en/ar) and description (en/ar), 422 error handling
- **Delete dialog**: Confirmation with FAQ title
- **Route**: `/faqs` (not yet registered in App.tsx)
- **i18n**: Full EN/AR keys

## Verified APIs
- `GET /api/v1/faqs?limit=3` — ✅ Returns paginated list (50 items)
- `GET /api/v1/faqs/1` — ✅ Returns detail with parsed JSON title
- `POST /api/v1/faqs` (JSON) — ✅ Creates FAQ, returns 201
- `PUT /api/v1/faqs/51` (JSON) — ✅ Updates FAQ correctly
- `PUT /api/v1/faqs/reorder` — ✅ Reorders successfully
- `DELETE /api/v1/faqs/51` — ✅ Deletes successfully
- `GET /api/v1/general/faqs` — ✅ Returns public FAQ list

## API Bugs
1. **`status` field always null** — `GET /api/v1/faqs` and `GET /api/v1/faqs/{id}` return `status: null` for all FAQs. The Faq type expects a `boolean`. Status badge cannot display.
2. **`order` field always null** — The `order` field is always `null`. Drag-and-drop reorder sends the correct PUT request but the `order` value is never returned, so the reorder column shows blank.
3. **`faq_type` field always null** — The `faq_type` field is always `null`. The type badge (global/shop) cannot display.

## Notes
- The existing code is well-implemented but these API issues prevent status badge, type badge, and order column from working.
- The `CreateFaqData` and `UpdateFaqData` types match the API (no extra fields).
- The form dialog doesn't include a status toggle because the API doesn't return or accept status.
