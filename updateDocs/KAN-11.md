# KAN-11: Category Module Changes

## Changes

### 1. Tree Table with Expand/Collapse (`categories-table.tsx`)
- Flat API list data is built into a client-side tree using `parent_id`
- Root nodes rendered first; children rendered indented below expanded parents
- Expand/collapse chevron (`ChevronRight`/`ChevronDown`) shown for categories with children
- Indentation: `depth * 20px` padding per level
- Children computed via `childrenMap` (memoized `Map<parent_id, CategoryListItem[]>`)
- Added expand/collapse column as first table column (w-8)

### 2. Status Field (`category.types.ts`, `category.schema.ts`, `categories.api.ts`, `category-form-dialog.tsx`, `categories-table.tsx`)
- Added `status: boolean` to `Category`, `CategoryListItem`, `CreateCategoryData`, `UpdateCategoryData`
- Added `status` field (z.boolean(), default `true`) to Zod schema
- Added `status` to `toApiFormat()` — sent as `"1"` or `"0"` in form data
- Added `status` to `FormData` in both `createCategory()` and `updateCategory()` API calls
- Form: added Switch toggle for status with label showing active/inactive
- Table: added status `Badge` column (green/red) showing active/inactive

### 3. Inline Featured Toggle (`categories-table.tsx`)
- Moved featured toggle from dropdown menu to direct button in the action column
- Star icon fills yellow when `is_featured=true`, outline when false
- Uses `onToggleFeatured` callback directly on button click

### 4. Delete with Children Warning (`category-delete-dialog.tsx`, `categories-table.tsx`)
- `CategoryDeleteDialog` accepts new `hasChildren?: boolean` prop
- When `hasChildren=true`: shows yellow warning banner with `AlertTriangle` icon
- Delete button is disabled when category has children (prevents 400 errors)
- `hasChildren` computed from `childrenMap` in the table
- Added `categories.childrenWarning` translation key

### 5. Fix Edit Multilingual Bug (`category-form-dialog.tsx`)
- Previously only populated the current UI language field on edit (e.g., only `nameEn` when viewing in English)
- Now populates both `nameEn` and `nameAr` (and `detailsEn`/`detailsAr`) from the API response
- Since the API returns `name` as a single string (not locale-object), both fields get the same value
- Removed dependency on `i18n.language` so both languages are always filled

### 6. Translation Keys Added
- `categories.active` — "Active"
- `categories.inactive` — "Inactive"
- `categories.childrenWarning` — "This category has subcategories..."

### 7. Architecture
- Types and schema aligned with API contract (status, parent_id, is_featured all present)
- No route constants needed (categories follow inline route pattern in App.tsx)

## API Bugs
- None found — all category endpoints (list, detail, create, update, delete, featured, toggle) work correctly
- Note: delete succeeds even when category has children; the frontend now prevents this at the UI level
