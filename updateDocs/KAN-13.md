# KAN-13: Product Edit/Update

## Changes
1. **`src/features/products/routes/product.routes.ts`** — Added `edit: (id: number) => string` route constant pointing to `/products/:id/edit`
2. **`src/features/products/components/product-form.tsx`** — Extended `ProductFormProps` with optional `productId` and `initialValues`; added `useEffect` to pre-fill form via `form.reset()`; submit logic switches between `useCreateProduct` and `useUpdateProduct` based on `productId`; submit button text changes to "Edit Product" in edit mode
3. **`src/features/products/pages/edit-product-page.tsx`** — New page: fetches product by ID via `useProduct(id)`, converts `Product` → `ProductFormValues` via `productToFormValues()` helper (handles JSON-parsed localized fields, nested variants, discount/flash sale/relations arrays), renders `<ProductForm>` with `productId` and `initialValues`
4. **`src/features/products/pages/product-detail-page.tsx`** — Added Edit button (pencil icon) beside Delete button, navigates to `/products/:id/edit`
5. **`src/features/products/components/products-table.tsx`** — Added `onEdit` prop; added "Edit" menu item in both desktop and mobile card dropdowns
6. **`src/features/products/pages/products-page.tsx`** — Added `handleNavigateEdit` handler passing `onEdit` to table
7. **`src/features/products/index.ts`** — Exported `EditProductPage`
8. **`src/app/App.tsx`** — Added lazy import and route `/products/:id/edit` (placed before the catch-all `:id` route)
9. **`src/shared/i18n/locales/en/translation.json`** — Added `productsForm.editProduct` ("Edit Product") and `productsForm.editSubtitle` ("Update the product details below.")
10. **`src/shared/i18n/locales/ar/translation.json`** — Added Arabic translations for edit product title/subtitle

## API Bugs
- None found. `PUT /api/v1/products/{id}` with JSON body works correctly for all field types.
