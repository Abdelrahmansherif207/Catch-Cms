# KAN-7 — Admin Users

## Changes

### 1. Filter Tabs (All / Active / Inactive / Trashed)
- **File:** `src/features/users/pages/users-page.tsx`
- Replaced `activeFilter` select dropdown + `showTrash` toggle button with a `Tabs` component (All / Active / Inactive / Trashed)
- Removed `toggleTrash()` function
- Status tab value drives `active`, `inActive`, and `trash` API params

### 2. Sortable Column Headers
- **File:** `src/features/users/components/users-table.tsx`
- Added `orderBy`, `sort`, `onSortChange` props to `UsersTable` interface
- Added `SortIcon` component showing `ArrowUpDown` / `ArrowUp` / `ArrowDown` based on sort state
- Made `Name`, `Email`, and `Created At` column headers clickable — clicking toggles sort direction
- Removed sort-by and sort-direction select dropdowns from the page header
- Added `type` column to the table (visible on all rows)

### 3. User Detail Page (`/users/:id`)
- **New File:** `src/features/users/pages/user-detail-page.tsx`
- **Route:** `App.tsx` — added `<Route path="/users/:id" element={<UserDetailPage />} />`
- **Routes:** `src/features/users/routes/user.routes.ts` — `userRoutes.detail(id)`
- **Page content:**
  - Profile card with avatar, name, email, phone, status badges (active/inactive, type, email verified)
  - Tabs: Roles & Permissions (with nested role permissions as badges), Addresses (user type only, placeholder)
  - Quick actions: Toggle Activation, Delete
  - 404 state with "User not found" message + back button
  - Loading skeleton
  - Created at timestamp

### 4. Edit Button → Detail Page
- **File:** `src/features/users/components/users-table.tsx`
- Added "View" (eye icon) dropdown item in non-trash mode → navigates to `/users/:id`
- Removed the old "sort by" selects; replaced with clickable column headers

### 5. Avatar Upload on Create Form
- **File:** `src/features/users/components/user-form-dialog.tsx`
- Added circular avatar upload area at the top of the form with hover overlay
- Added hidden file input with `accept="image/*"`
- `ImagePreview` state shows selected image before upload
- **Schema:** `src/features/users/schemas/user.schema.ts` — added optional `image: z.instanceof(File)` field
- **API:** `src/features/users/api/users.api.ts` — `createUser()` now builds `FormData` (appends all fields including `image` as file)
- **Types:** `src/features/users/types/user.types.ts` — added optional `image?: File` to `CreateUserData`

### 6. Password Strength Indicator
- **File:** `src/features/users/schemas/user.schema.ts`
- Added `getPasswordStrength()` function returning `{ label, color, percent }` based on length, uppercase, lowercase, digit, and special char checks
- **File:** `src/features/users/components/user-form-dialog.tsx`
- Added password strength bar below password input — shows colored progress bar + label (Weak / Fair / Good / Strong)

### 7. Auto-Reset Create Form After Success
- **File:** `src/features/users/components/user-form-dialog.tsx`
- Added `useEffect` watching `createMutation.isSuccess` — resets form, server errors, and image preview after successful creation

### 8. 404 Handling on Detail Page
- **File:** `src/features/users/pages/user-detail-page.tsx`
- When `isError` is true or `user` is null, shows centered "User not found" message with back button

### 9. Type Updates
- **File:** `src/features/users/types/user.types.ts`
- Added `phone_number: string` and `type: string` fields to `User` interface
- Added `UserDetail` interface extending `User` with `roles: UserRole[]`
- Added `fetchUser(id)` API function and `useUser(id)` hook

### 10. Translations Added
- **Files:** `en/translation.json` and `ar/translation.json`
- New keys under `users`: `notFound`, `emailVerified`, `notVerified`, `rolesTab`, `addressesTab`, `noRoles`, `noAddresses`

---

## API Bugs

| # | Endpoint | Issue |
|---|---|---|
| BUG-1 | `GET /api/v1/users?admins=1` | Filter is ignored — returns all users including `type=user`. Expected: only users with `type=admin`. |
| BUG-2 | `GET /api/v1/users?in_active=1` | Filter is ignored — returns all users including `is_active=1`. Expected: only users with `is_active=0`. |
| BUG-3 | `GET /api/v1/users?trash=1` | Filter is ignored — returns all users. Expected: only trashed/soft-deleted users. |

All three bugs were confirmed via curl tests on `2026-07-20`. The listing endpoint correctly paginates, searches, and sorts, but the `admins`, `in_active`, and `trash` query parameters have no effect.
