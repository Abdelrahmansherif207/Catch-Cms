# KAN-14: Reviews Admin Management

## Changes
1. **`src/features/reviews/types/review.types.ts`** — Review type, ReviewsListResponse, FetchReviewsParams
2. **`src/features/reviews/api/reviews.api.ts`** — `fetchReviews(productId)`, `toggleApproveReview(id)`, `deleteReview(id)`
3. **`src/features/reviews/hooks/use-reviews.ts`** — `useReviews`, `useToggleApproveReview`, `useDeleteReview` with React Query
4. **`src/features/reviews/routes/review.routes.ts`** — Route constant `list: '/reviews'`
5. **`src/features/reviews/permissions/review.permissions.ts`** — REVIEW_PERMISSIONS constants
6. **`src/features/reviews/components/star-rating.tsx`** — Reusable star rating component (display + interactive modes, size variants)
7. **`src/features/reviews/components/review-delete-dialog.tsx`** — Delete confirmation dialog with review preview (rating stars + comment)
8. **`src/features/reviews/components/reviews-table.tsx`** — Admin table with columns: ID, rating stars, comment (truncated), images thumbnails, approval badge (green/yellow), approve/unapprove toggle button, delete button; skeleton loading
9. **`src/features/reviews/pages/reviews-page.tsx`** — Admin page with product search/select combobox (via `useProducts`), status filter (All/Approved/Pending), reviews table, empty state prompting product selection
10. **`src/features/reviews/index.ts`** — Barrel exports for all public API
11. **`src/shared/lib/query-keys.ts`** — Added `reviews` query key factory
12. **`src/shared/i18n/locales/en/translation.json`** — Added `reviews.*` translation keys
13. **`src/shared/i18n/locales/ar/translation.json`** — Added Arabic translations for reviews module
14. **`src/app/App.tsx`** — Added lazy import and `/reviews` route

## API Bugs
- None found. All endpoints work correctly.
