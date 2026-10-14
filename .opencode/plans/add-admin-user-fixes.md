# Plan: Align "Add User" frontend with validated backend contract (5 fixes)

Backend `POST /admin-users/add` validated live — all documented contracts pass (200/401/405/422 shapes exact). These fixes close the gaps between the frontend form and the server contract.

## A. Gate the Create User button — `src/features/users/pages/users-page.tsx`

- Add imports:
  ```tsx
  import { usePermissions } from '@/shared/auth/guards';
  import { PERMISSIONS } from '@/shared/auth/permissions';
  ```
- In `UsersPage`: `const { can } = usePermissions();`
- Wrap the action (line ~89):
  ```tsx
  actions={
    !showTrash && can(PERMISSIONS.users.create) && (
      <Button onClick={() => setFormOpen(true)}>
        <Plus className="me-2 h-4 w-4" />
        {t('users.addUser')}
      </Button>
    )
  }
  ```
  (`PERMISSIONS.users.create` = `'create-user'`, mirrors backend middleware on `adminAddUsers`.)

## B. Password max — `src/features/users/schemas/user.schema.ts`

```ts
password: z.string().min(8, 'validation.passwordMin').max(50, 'validation.passwordMax'),
```

- i18n: add `validation.passwordMax` under the **top-level `validation`** block in BOTH locale files:
  - `src/shared/i18n/locales/en/translation.json`: `"passwordMax": "Password must not exceed 50 characters"` (right after `passwordMin`)
  - `src/shared/i18n/locales/ar/translation.json`: `"passwordMax": "كلمة المرور يجب ألا تتجاوز 50 حرفًا"`

## C. Image file types — `src/features/users/components/user-form-dialog.tsx`

- Change the file input accept to the backend's mimes list (`jpeg,png,jpg,webp,gif` → browser MIME names):
  ```tsx
  accept="image/jpeg,image/png,image/webp,image/gif"
  ```
  (replaces `accept="image/*"`)

## D. Inline server-error key mapping — `src/features/users/components/user-form-dialog.tsx`

- Replace the `onError` in `onSubmit` (currently `setServerErrors(apiError.errors)` — snake_case Laravel keys don't match camelCase form field names, so phone/roles errors never render inline):

  ```tsx
  onError: (error: unknown) => {
    const apiError = error as ApiErrorResponse;
    if (apiError?.status === 422 && apiError.errors) {
      const fieldMap: Record<string, string> = {
        phone_number: 'phoneNumber',
        roles: 'roleIds',
      };
      const normalized: Record<string, string[]> = {};
      Object.entries(apiError.errors).forEach(([key, messages]) => {
        const base = key.split('.')[0];
        const field = fieldMap[base] ?? base;
        (normalized[field] ??= []).push(...messages);
      });
      setServerErrors(normalized);
    }
  },
  ```

  Effect: "The phone number has already been taken." appears under the phone input; "The selected role is invalid." under the roles selector. (`password_confirmation` errors already arrive under `password`, which matches an existing field key.)

## E. Type cleanup — `src/features/users/types/user.types.ts`

Align `CreateUserResponseData` with the live UserResource (verified by curl):

```ts
export interface CreateUserResponseData {
  id: number;
  name: string;
  email: string;
  email_verified_at: string;
  is_active: number | boolean;
  image: string | null;
  type: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
  roles: UserRole[];
  permissions: UserPermission[];
}
```

## Verification

1. `npm.cmd run lint` — expect only the 2 pre-existing errors (`coupon-config-checker.tsx:57`, `settings-page.tsx:31`).
2. `npx.cmd tsc -b --pretty false` — clean.
3. Manual: Create User button hidden without `create-user`; 51-char password rejected client-side; bmp upload blocked by picker; duplicate phone shows inline under phone field.
