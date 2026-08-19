# KAN-9 — Role & Permission

## Changes

### 1. Role Detail Page (`/roles/:id`)
- **New File:** `src/features/roles/pages/role-detail-page.tsx`
- **Route:** `App.tsx` — added `<Route path="/roles/:id" element={<RoleDetailPage />} />`
- **Routes:** `src/features/roles/routes/role.routes.ts` — `roleRoutes.detail(id)`
- **Page content:**
  - Back navigation + role name header
  - Role info card: ID, Display Name (EN + AR), Guard (api)
  - Permissions card with all permissions as badges
  - Edit + Delete action buttons (Edit navigates back to list, Delete opens confirmation)
  - Loading state with spinner
  - 404 state with "Role not found" message + back button
  - On successful delete: redirect to roles list with cache invalidation

### 2. View Action in Roles Table
- **File:** `src/features/roles/components/roles-table.tsx`
- Added "View" dropdown item (Eye icon) — navigates to `/roles/:id`
- Added `Eye` import from lucide-react, `useNavigate` for navigation

### 3. Sortable Columns (ID, Display Name)
- **File:** `src/features/roles/components/roles-table.tsx`
- Added client-side sort state (`sortField`, `sortDir`) — toggles asc/desc on click
- Clickable column headers for ID and Display Name with `ArrowUpDown` / `ArrowUp` / `ArrowDown` icons
- Added `useMemo` sorted list derived from `data`

### 4. Guard Column in Table
- **File:** `src/features/roles/components/roles-table.tsx`
- Added "Guard" column header and cell (always "api" since API doesn't return `guard_name`)
- Updated TableSkeleton to 4 columns

### 5. Error State with Retry in Table
- **File:** `src/features/roles/components/roles-table.tsx`
- Added `isError` prop to `RolesTable` interface
- When `isError` is true: shows error message + "Retry" button that calls `onRefresh`
- Added `RefreshCw` icon and `t('common.retry')` translation

### 6. Name Auto-Generation from English Display Name
- **File:** `src/features/roles/schemas/role.schema.ts`
- Added `autoGenerateName()` function: lowercases, replaces spaces with underscores, removes non-alphanumeric
- Added `name` field to `roleFormSchema` (optional)

### 7. Name + Guard Fields in Create/Edit Form
- **File:** `src/features/roles/components/role-form-dialog.tsx`
- Added read-only "System Name" field — auto-fills as user types English display name
- Added read-only "Guard Name" field — always shows "api"
- Changed English name input to controlled component with `handleNameEnChange` callback
- Added `useCallback` import, `autoGenerateName` import from schema

### 8. Permissions Grid 403 Error Handling
- **File:** `src/features/roles/components/role-permissions-grid.tsx`
- Detects 403 error from `usePermissions` hook via `isError` + error status check
- When 403: shows `ShieldX` icon + "You don't have permission to view permissions" message
- Still functions if permissions load successfully (non-403)

### 9. Permissions API 403 Handling in Hooks
- **File:** `src/features/roles/hooks/use-roles.ts`
- Updated `usePermissions` to catch 403 errors and return empty data instead of throwing
- Added `retry: false` for 403 errors (no point retrying permission errors)

### 10. Role Detail API — Include Permissions
- **File:** `src/features/roles/api/roles.api.ts`
- Updated `fetchRole(id)` to call `/roles/{id}?with=permissions` (was missing query param)

### 11. Types Extended
- **File:** `src/features/roles/types/role.types.ts`
- Added optional `guard_name`, `created_at` to `Role` and `RoleDetail` interfaces
- Made `name` optional in `RoleDetail` (API may not return it)

### 12. Translations Added
- **File:** `src/shared/i18n/locales/en/translation.json`
- `common.retry`: "Retry"
- `roles.guardName`: "Guard", `roles.roleDetail`: "Role Details", `roles.roleInfo`: "Role Information", `roles.permissionsCount`: "Permissions ({{count}})", `roles.noPermissions`: "No permissions assigned", `roles.backToList`: "Back to Roles", `roles.notFound`: "Role not found", `roles.loadError`: "Failed to load roles", `roles.permissionsForbidden`: "You don't have permission to view permissions"
- **File:** `src/shared/i18n/locales/ar/translation.json` — Arabic translations for all new keys

### 13. Exports
- **File:** `src/features/roles/index.ts` — added `RoleDetailPage` and `roleRoutes` exports

## API Bugs

### Bug 1: Permissions endpoints return 403 for admin users
- `GET /api/v1/permissions?limit=200` returns 403 "User doesn't have required permissions"
- `POST /api/v1/roles/{roleId}/permissions` returns 403 "User doesn't have required permissions"
- **Impact:** Permissions grid in create/edit role form cannot load or assign permissions. FE-RBAC-008 (Permissions List Page) and FE-RBAC-009 (Role-Permission Assignment) fully blocked.
- **Expected:** Admin users with appropriate role should be able to view and assign permissions.

### Bug 2: Create role stores display_name as false
- `POST /api/v1/roles` with `display_name[en]=...&display_name[ar]=...` creates the role but `display_name` is stored as `false`
- **Impact:** Created roles cannot display their actual name. The edit form cannot pre-fill display name fields.
- **Expected:** `display_name` should store the JSON object `{"en": "...", "ar": "..."}`

### Bug 3: Roles list response missing fields
- `GET /api/v1/roles` returns only `id` and `display_name` (JSON string)
- Missing: `name`, `guard_name`, `created_at`, `updated_at`
- Also missing pagination metadata (`total`, `per_page`, `current_page`, `last_page`)
- **Impact:** Cannot display system name, guard, or creation date in table. Cannot implement server-side pagination.
- **Expected:** API should return full role data with proper pagination metadata.

### Bug 4: User detail response missing roles
- `GET /api/v1/users/{id}` does not include `roles` array in response
- **Impact:** RoleUserAssign component cannot determine which users already have a role (it falls back to individual user fetches)
- **Expected:** User detail should include an array of assigned roles

### Bug 5: Remove-role endpoint returns 403
- `POST /api/v1/users/{userId}/remove-role` returns 403 "User doesn't have required permissions"
- Note: `assign-role` works for some users but `remove-role` is universally blocked
- **Impact:** Cannot remove roles from users via UI

### Bug 6: User direct permission endpoints return 403
- `POST /api/v1/users/{userId}/permissions` — 403
- `PUT /api/v1/users/{userId}/permissions` — not tested (likely same)
- `DELETE /api/v1/users/{userId}/permissions` — not tested (likely same)
- **Impact:** FE-RBAC-010 (User Direct Permission Management) fully blocked

### Bug 7: Delete role doesn't check for conflicts
- `DELETE /api/v1/roles/{id}` succeeds even when the role has assigned users
- No 409 conflict response is returned
- **Impact:** Cannot implement conflict handling UI (FE-RBAC-005). Users may lose permissions silently.
- **Expected:** If role has assigned users, return 409 with user count and block deletion

### Bug 8: Login response missing permissions/role info
- `POST /api/v1/token` returns only `token` and `email_verified` — no `permissions` or `role` arrays
- **Impact:** Auth store's `hasPermission()` and `hasRole()` methods have no data to work with. FE-RBAC-011 (Route Guards) cannot function.
- **Expected:** Login response should include `permissions: string[]` and `role: string[]` matching the `AuthData` type
