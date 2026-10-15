# Plan: Fix blank page when opening the Roles dropdown in the Create User dialog

## Root cause (verified live + code)

`GET /roles` returns a paginated envelope — `{ ..., data: { data: Role[], current_page, total, ... } }` — but the users feature types it as a plain array (`RolesResponse { data: Role[] }`) and `user-form-dialog.tsx` consumes it as one:

```ts
const roles = rolesData?.data || [];   // ← actually the pagination wrapper object
```

When the Roles dropdown opens, `roles.map(...)` throws `TypeError: roles.map is not a function` → React 19 unmounts the tree → blank page. The bug fires exactly on the click because `roles.map` only renders inside `{rolesOpen && ...}`.

The separate `roles` feature models the same endpoint correctly (`ApiResponse<PaginatedData<Role>>` in `src/features/roles/types/role.types.ts`) — the users-feature copy is the outlier.

## Changes (2 files)

### 1. `src/features/users/types/user.types.ts` — fix the envelope type

```ts
export interface RolesResponse {
  status: number;
  message: string;
  success: boolean;
  data: {
    data: Role[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}
```

(Full paginated fields documented: `current_page, data, first_page_url, from, last_page, last_page_url, next_page_url, page, path, per_page, prev_page_url, to, total` — only the ones above are useful.)

### 2. `src/features/users/components/user-form-dialog.tsx` — one-line consumer fix

```ts
const roles = rolesData?.data?.data || [];
```

No other consumer: `useRoles` (users feature) is used only by `user-form-dialog.tsx`; `RolesResponse` is only consumed by `fetchRoles`.

## Verification

1. `npx.cmd tsc -b --pretty false` — clean.
2. `npm.cmd run lint` — only the 2 pre-existing errors.
3. Manual: open Create User dialog → click the Roles button → dropdown lists all 9 roles (localized display names via existing `parseDisplayName`) → no blank page; checkboxes still selectable; submit unchanged.
