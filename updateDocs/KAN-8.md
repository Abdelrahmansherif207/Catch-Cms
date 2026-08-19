# KAN-8 — Settings

## Changes

### 1. Fix Update Endpoint URL
- **File:** `src/features/settings/api/settings.api.ts`
- Changed from `POST /settings/1` (404) to `POST /settings` with `_method=PUT`
- The correct API endpoint is `PUT /api/v1/settings` (no ID), not `/settings/1`

### 2. Add Fast Shipping Toggle
- **Files:** `src/features/settings/types/settings.types.ts`, `src/features/settings/schemas/settings.schema.ts`, `src/features/settings/pages/settings-page.tsx`
- Added `fast_shipping_page_publish` field to `Settings` type
- Added `fastShippingPublish` form field with `Select` dropdown (Enabled/Disabled)
- Loads current value from API response, sends back as string `"0"` or `"1"`

### 3. Add `options` to Settings Type
- **File:** `src/features/settings/types/settings.types.ts`
- Added `options: Record<string, any> | null` to `Settings` interface

### 4. Image Upload Validation
- **File:** `src/features/settings/schemas/settings.schema.ts`
- Added `imageFileSchema` with:
  - Format restriction: only `image/jpeg`, `image/png`, `image/gif`, `image/svg+xml`
  - Size limit: 2MB max (`2 * 1024 * 1024`)
  - Client-side validation via zod `.refine()`
- Updated file input `accept` attribute to match allowed types
- Added inline error display for `getError('logo')` and `getError('favicon')`

### 5. Translations Added
- **Files:** `en/translation.json` and `ar/translation.json`
- `validation.imageFormat` — format restriction message
- `validation.imageMaxSize` — file size message
- `settings.fastShippingLabel` — shipping section label
- `settings.fastShippingDesc` — shipping description
- `common.enabled` / `common.disabled` — toggle labels

---

## API Bugs

| # | Endpoint | Issue |
|---|---|---|
| BUG-1 | `PUT /api/v1/settings` | Correct endpoint is `PUT /settings` (no ID). The frontend was using `POST /settings/1` which returns 404. The spec says `PUT /api/v1/settings` which is now confirmed working. |
| BUG-2 | `POST /api/v1/settings/1` (with `_method=PUT`) | Returns 404 — the route `/settings/1` does not exist. The correct route is `/settings` without an ID. |

The `GET /api/v1/settings` endpoint works correctly, returning all fields including `fast_shipping_page_publish` and `options`. The `PUT /api/v1/settings` endpoint accepts `multipart/form-data` and requires all translatable fields (`site_name[en/ar]`, `site_desc[en/ar]`, `meta_desc[en/ar]`, `site_copy_right[en/ar]`) plus contact/social fields and optional file uploads for `logo` and `favicon`.
