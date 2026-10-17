import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, UserMinus, UserPlus, Users } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { CardSection } from '@/shared/components/card-section';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { usePermissions } from '@/shared/auth/guards';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useRemoveWarehouseUser, useWarehouseUsers } from '../hooks/use-warehouses';
import { AssignWarehouseUsersDialog } from './assign-warehouse-users-dialog';
import type { Warehouse, WarehouseUser } from '../types/warehouse.types';

interface WarehouseUsersCardProps {
  warehouse: Warehouse;
  onChanged?: () => void;
}

export function WarehouseUsersCard({ warehouse, onChanged }: WarehouseUsersCardProps) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.warehouses.manage);

  const [assignOpen, setAssignOpen] = useState(false);
  const [removingUser, setRemovingUser] = useState<WarehouseUser | null>(null);
  const { data, isLoading } = useWarehouseUsers(warehouse.id);
  const users = data?.data ?? [];
  const removeMutation = useRemoveWarehouseUser();

  return (
    <CardSection
      title={t('warehouses.usersTitle')}
      description={t('warehouses.usersDescription')}
      icon={Users}
      action={
        canManage ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAssignOpen(true)}
          >
            <UserPlus className="me-1.5 h-4 w-4" />
            {t('warehouses.assignUsers')}
          </Button>
        ) : undefined
      }
    >

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('warehouses.usersEmpty')}</p>
      ) : (
        <ul className="space-y-2">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <span className="truncate">{user.name}</span>
                  {Boolean(user.pivot?.is_primary) && (
                    <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Badge variant="outline">{user.type}</Badge>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('warehouses.removeUser')}
                    title={t('warehouses.removeUser')}
                    disabled={removeMutation.isPending}
                    onClick={() => setRemovingUser(user)}
                  >
                    <UserMinus className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {assignOpen && (
        <AssignWarehouseUsersDialog
          warehouse={warehouse}
          assigned={users}
          open={assignOpen}
          onOpenChange={setAssignOpen}
          onSuccess={() => {
            setAssignOpen(false);
            onChanged?.();
          }}
        />
      )}

      <ConfirmDialog
        open={removingUser !== null}
        onOpenChange={(open) => {
          if (!open) setRemovingUser(null);
        }}
        title={t('warehouses.removeUserTitle', { name: removingUser?.name ?? '' })}
        description={t('warehouses.removeUserConfirm', {
          name: removingUser?.name ?? '',
          warehouse: warehouse.name,
        })}
        confirmLabel={t('warehouses.removeUser')}
        loading={removeMutation.isPending}
        onConfirm={() => {
          if (!removingUser) return;
          removeMutation.mutate(
            { id: warehouse.id, userId: removingUser.id },
            { onSuccess: () => setRemovingUser(null) }
          );
        }}
      />
    </CardSection>
  );
}
