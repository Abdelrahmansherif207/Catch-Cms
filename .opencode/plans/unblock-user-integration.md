# Plan: Replace `admin-users/update-activation` with `block-user` + `unblock-user`

## Context

- New documented endpoints: `PATCH /users/block-user` and `PATCH /users/unblock-user`, body `{ "id": <userId> }`, admin-only (`activate-user` permission), success 200 `{status, message, success}`.
- Live server currently returns 404 "Resource Not Found" for valid ids on both paths (old deployed build; `PATCH users/{user}` shadows the static routes). Frontend integrates against the documented contract; error toasts surface the API message until backend deploys.
- Decision: switch fully to the new endpoints (remove legacy `toggleActivation`), gate UI with `activate-user` permission, optimistic updates, hide the action on the logged-in user's own row (backend rejects self-reactivation with 403).
- Current-user id comes from `useProfile()` (`GET /me` → `data.id`); the auth store user has no `id` field.

## Changes

### 1. `src/features/users/api/users.api.ts`

Remove `toggleActivation` and add:

```ts
export async function blockUser(id: number): Promise<ApiActionResponse> {
  const { data } = await axiosClient.patch<ApiActionResponse>('/users/block-user', { id });
  return data;
}

export async function unblockUser(id: number): Promise<ApiActionResponse> {
  const { data } = await axiosClient.patch<ApiActionResponse>('/users/unblock-user', { id });
  return data;
}
```

### 2. `src/features/users/hooks/use-users.ts`

- Import `blockUser`, `unblockUser` (replace `toggleActivation` import).
- Replace `useToggleActivation` with a shared internal hook + two exports:

```ts
function useActivationMutation(
  action: (id: number) => Promise<ApiActionResponse>,
  nextActive: boolean,
  fallbackError: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => action(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() });
      const queries = queryClient.getQueriesData<UsersListResponse>({ queryKey: queryKeys.users.lists() });
      const previousData = queries.map(([key, data]) => ({ key, data }));

      queryClient.setQueriesData<UsersListResponse>({ queryKey: queryKeys.users.lists() }, (old) => {
        if (!old?.data?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.map((item) =>
              item.id === id ? { ...item, is_active: nextActive } : item
            ),
          },
        };
      });

      return { previousData };
    },
    onSuccess: (response) => {
      toast.success(
        response.message ||
          (nextActive ? 'User activated successfully' : 'User deactivated successfully')
      );
    },
    onError: (error, _id, context) => {
      if (context?.previousData) {
        context.previousData.forEach(({ key, data }) => {
          if (data) queryClient.setQueryData(key, data);
        });
      }
      handleApiError(error, fallbackError);
    },
    onSettled: (_data, _error, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
    },
  });
}

export function useBlockUser() {
  return useActivationMutation(blockUser, false, 'Failed to deactivate user');
}

export function useUnblockUser() {
  return useActivationMutation(unblockUser, true, 'Failed to activate user');
}
```

### 3. `src/features/users/components/user-activation-dialog.tsx`

- Import `useBlockUser`, `useUnblockUser` (replace `useToggleActivation`).
- Pick the mutation by status; keep all props/labels as-is (existing `users.activate/deactivate` i18n keys are reused):

```tsx
const blockMutation = useBlockUser();
const unblockMutation = useUnblockUser();
const isActive = Boolean(currentStatus);
const mutation = isActive ? blockMutation : unblockMutation;

const handleToggle = () => {
  mutation.mutate(userId, {
    onSuccess: () => {
      onActivated();
      onOpenChange(false);
    },
  });
};
```

- Replace every `toggleMutation` reference with `mutation`.

### 4. `src/features/users/components/users-table.tsx`

- New imports:

```tsx
import { usePermissions } from '@/shared/auth/guards';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useProfile } from '@/features/profile';
```

- Inside `UsersTable`:

```tsx
const { can } = usePermissions();
const { data: profileData } = useProfile();
const currentUserId = profileData?.data?.id;
```

- Wrap the Activate/Deactivate dropdown item (permission + hide own row; fail-safe: item still shows while profile query loads — backend enforces 403):

```tsx
{can(PERMISSIONS.users.activate) && currentUserId !== user.id && (
  <DropdownMenuItem onClick={() => setActivationTarget(user)}>
    <Pencil className="me-2 h-4 w-4" />
    {user.is_active ? t('users.deactivate') : t('users.activate')}
  </DropdownMenuItem>
)}
```

### 5. `src/features/users/pages/user-detail-page.tsx`

- Same imports as above (guards/permissions/profile).
- Inside `UserDetailPage` (after `const user = data?.data;`):

```tsx
const { can } = usePermissions();
const { data: profileData } = useProfile();
const canActivate = can(PERMISSIONS.users.activate) && profileData?.data?.id !== user?.id;
```

- Render the Activate/Deactivate header button only when `canActivate` (Delete button unchanged).

### 6. `src/features/users/index.ts`

- Export `useBlockUser`, `useUnblockUser` instead of `useToggleActivation`.

### i18n

No changes — reuse existing `users.activate`, `users.deactivate`, `users.activateTitle`, `users.deactivateTitle`, `users.activateConfirm`, `users.deactivateConfirm` in both `en` and `ar`.

## Verification

1. `npm run lint`
2. `npx tsc -b` (typecheck; the `build` script is `tsc -b && vite build`)
3. Manual: users page → dropdown on another user shows Activate (inactive) / Deactivate (active); on own row the item is hidden; dialog calls the new PATCH endpoints; toast shows API message.
4. After backend redeploy, re-curl `PATCH /users/unblock-user` / `PATCH /users/block-user` to confirm 200 + expected messages.
