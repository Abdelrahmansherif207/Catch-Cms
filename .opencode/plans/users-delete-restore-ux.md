# Plan: Users delete/restore UX polish (A–D)

Both delete endpoints validated live as documented. Approved fixes: A permission gates, B own-row hiding, C distinct toasts, D Undo after soft delete.

## A + B. Permission gates + hide own row

### `src/features/users/components/users-table.tsx`

`can`, `PERMISSIONS`, `currentUserId` already exist in this file. Wrap the three items (trash view has Restore + Force Delete; normal rows have Delete):

```tsx
{can(PERMISSIONS.users.restore) && (
  <DropdownMenuItem onClick={() => setRestoreTarget(user)}>
    <RefreshCcw className="me-2 h-4 w-4" />
    {t('users.restore')}
  </DropdownMenuItem>
)}
{can(PERMISSIONS.users.delete) && currentUserId !== user.id && (
  <DropdownMenuItem className="text-destructive" onClick={() => setForceDeleteTarget(user)}>
    <Trash className="me-2 h-4 w-4" />
    {t('users.forceDelete')}
  </DropdownMenuItem>
)}
```

```tsx
{can(PERMISSIONS.users.delete) && currentUserId !== user.id && (
  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(user)}>
    <Trash2 className="me-2 h-4 w-4" />
    {t('common.delete')}
  </DropdownMenuItem>
)}
```

### `src/features/users/pages/user-detail-page.tsx`

```tsx
const canDelete = can(PERMISSIONS.users.delete) && profileData?.data?.id !== user?.id;
```
Render the Delete header button only when `canDelete` (pattern identical to the existing `canActivate` gate).

## C + D. `src/features/users/hooks/use-users.ts`

- Add `import { useTranslation } from 'react-i18next';` and call `const { t } = useTranslation();` inside the two mutation hooks.
- **C** distinct toasts (server uses the identical string "User deleted successfully" for both soft and hard delete, so hooks now own the wording):
  - `useDeleteUser` → `toast.success(t('users.movedToTrash'))`
  - `useForceDeleteUser` → `toast.success(t('users.permanentlyDeleted'))`
- **D** Undo action for soft delete (replaces the plain success toast; `restoreUser` already in file, `queryClient` available; `common.undo` i18n key exists ✓ en/ar):

```ts
onSuccess: (_response, id) => {
  toast.success(t('users.movedToTrash'), {
    duration: 8000,
    action: {
      label: t('common.undo'),
      onClick: () => {
        restoreUser(id)
          .then((restoreResponse) => {
            toast.success(restoreResponse.message || t('users.restore'));
            queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
          })
          .catch((error) => handleApiError(error, 'Failed to restore user'));
      },
    },
  });
  queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
},
```

(`restoreUser` returns the typed response; its invalidation also refreshes the trash tab since trash lists share the `['users','list']` query-key prefix.)

## i18n — `en` + `ar` translation.json (users block, after `"forceDelete"` key)

en (users lines ~1344):
```json
"forceDelete": "Delete Forever",
"movedToTrash": "User moved to trash",
"permanentlyDeleted": "User permanently deleted",
```
ar (~1248):
```json
"forceDelete": "حذف نهائي",
"movedToTrash": "تم نقل المستخدم إلى السلة",
"permanentlyDeleted": "تم حذف المستخدم نهائيًا",
```

Copy honesty fix — soft delete IS undoable:
- en `deleteWarning`: `" The action cannot be undone."` → `" The user will be moved to trash and can be restored."`
- ar `deleteWarning`: `" لا يمكن التراجع عن هذا الإجراء."` → `" سيتم نقل المستخدم إلى السلة ويمكن استعادته."`

## Verification

1. `npx.cmd tsc -b --pretty false` — clean.
2. `npm.cmd run lint` — only the 2 pre-existing errors.
3. Manual: without `delete-user`/`restore-user` the menu items disappear; own row never shows Delete; soft delete toasts "User moved to trash" with Undo (click restores); force delete toasts "User permanently deleted".
