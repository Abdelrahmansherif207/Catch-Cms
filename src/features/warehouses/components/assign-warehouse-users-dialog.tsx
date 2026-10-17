import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Checkbox } from '@/shared/ui/checkbox';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import type { ApiErrorResponse } from '@/shared/api';
import { usePermissions } from '@/shared/auth/guards';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useUsers } from '@/features/users/hooks/use-users';
import type { User } from '@/features/users/types/user.types';
import { useAssignWarehouseUsers } from '../hooks/use-warehouses';
import type {
  Warehouse,
  WarehouseAssignMode,
  WarehouseUser,
} from '../types/warehouse.types';

interface AssignWarehouseUsersDialogProps {
  warehouse: Warehouse;
  /** Current pivot list — pre-checks the selection on open. */
  assigned: WarehouseUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const MODES: WarehouseAssignMode[] = ['attach', 'sync', 'detach'];
const USERS_PAGE_SIZE = 20;

/** Map a pivot row to the picker's User shape (no extra fields needed). */
function toPickerUser(user: WarehouseUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    email_verified_at: null,
    is_active: 1,
    image: null,
    phone_number: '',
    type: user.type,
    permissions: [],
  };
}

export function AssignWarehouseUsersDialog({
  warehouse,
  assigned,
  open,
  onOpenChange,
  onSuccess,
}: AssignWarehouseUsersDialogProps) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canViewUsers = can(PERMISSIONS.users.view);

  const assignMutation = useAssignWarehouseUsers();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading: usersLoading } = useUsers({
    search: debouncedSearch || undefined,
    perPage: USERS_PAGE_SIZE,
  });
  const users: User[] = data?.data?.data ?? [];

  // Selection lives outside the search results so choices survive paging.
  // The dialog is conditionally mounted on open, so props seed the initial
  // selection directly (no reset effect needed).
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(assigned.map((user) => user.id))
  );
  const [selectedUsers, setSelectedUsers] = useState<Map<number, User>>(
    () => new Map(assigned.map((user) => [user.id, toPickerUser(user)]))
  );
  const [mode, setMode] = useState<WarehouseAssignMode>('attach');

  const toggle = (user: User) => {
    setServerErrors({});
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(user.id)) {
        next.delete(user.id);
        setSelectedUsers((map) => {
          const nextMap = new Map(map);
          nextMap.delete(user.id);
          return nextMap;
        });
      } else {
        next.add(user.id);
        setSelectedUsers((map) => new Map(map).set(user.id, user));
      }
      return next;
    });
  };

  const selectedCount = selectedIds.size;
  const isPending = assignMutation.isPending;

  const submit = () => {
    setServerErrors({});
    assignMutation.mutate(
      {
        id: warehouse.id,
        payload: { user_ids: Array.from(selectedIds), mode },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
        onError: (error) => {
          const apiError = error as unknown as ApiErrorResponse;
          if (apiError?.status === 422 && apiError.errors) {
            setServerErrors(apiError.errors);
          }
        },
      }
    );
  };

  const selectedChips = useMemo(
    () =>
      Array.from(selectedUsers.entries())
        .filter(([id]) => selectedIds.has(id))
        .map(([id, user]) => ({ id, user })),
    [selectedUsers, selectedIds]
  );

  const modeHint =
    mode === 'sync'
      ? t('warehouses.modeSyncHint')
      : mode === 'detach'
        ? t('warehouses.modeDetachHint')
        : t('warehouses.modeAttachHint');

  const renderUserRow = (user: User) => {
    const checked = selectedIds.has(user.id);
    return (
      <label
        key={user.id}
        className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 hover:bg-muted/50"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Checkbox checked={checked} onCheckedChange={() => toggle(user)} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Badge variant="outline">{user.type}</Badge>
      </label>
    );
  };

  const idsError = serverErrors['user_ids']?.[0] ?? serverErrors['user_ids.0']?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('warehouses.assignUsersTitle')}</DialogTitle>
          <DialogDescription>
            {t('warehouses.assignUsersDescription', { name: warehouse.name })}
          </DialogDescription>
        </DialogHeader>

        {canViewUsers ? (
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('warehouses.usersSearchPlaceholder')}
              className="ps-9"
            />
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t('warehouses.usersViewPermissionHint')}
            </p>
          </div>
        )}

        {canViewUsers && (
          <div className="max-h-56 space-y-1.5 overflow-y-auto pe-1">
            {usersLoading ? (
              <>
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
              </>
            ) : users.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t('warehouses.usersNoResults')}
              </p>
            ) : (
              users.map(renderUserRow)
            )}
          </div>
        )}

        {canViewUsers && selectedCount > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              {t('warehouses.selectedCount', { count: selectedCount })}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selectedChips.map(({ id, user }) => (
                <Badge key={id} variant="secondary" className="max-w-56 gap-1 font-normal">
                  <span className="truncate">{user.name}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="warehouse-users-mode">{t('warehouses.mode')}</Label>
          <Select
            value={mode}
            onValueChange={(v) => {
              if (MODES.includes(v as WarehouseAssignMode)) setMode(v as WarehouseAssignMode);
            }}
          >
            <SelectTrigger id="warehouse-users-mode" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="attach">{t('warehouses.modeAttach')}</SelectItem>
              <SelectItem value="sync">{t('warehouses.modeSync')}</SelectItem>
              <SelectItem value="detach">{t('warehouses.modeDetach')}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{modeHint}</p>
        </div>

        {idsError && <p className="text-xs text-destructive">{idsError}</p>}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={submit} disabled={isPending || selectedCount === 0}>
            {isPending ? t('common.updating') : t('common.update')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
