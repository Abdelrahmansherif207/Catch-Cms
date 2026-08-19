import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  MoreHorizontal,
  Pencil,
  Eye,
  Trash2,
  RefreshCcw,
  Trash,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Skeleton } from '@/shared/ui/skeleton';
import { UserStatusBadge } from './user-status-badge';
import { UserActivationDialog } from './user-activation-dialog';
import { UserDeleteDialog } from './user-delete-dialog';
import { UserForceDeleteDialog } from './user-force-delete-dialog';
import { UserRestoreDialog } from './user-restore-dialog';
import type { User } from '../types/user.types';

interface UsersTableProps {
  data: User[];
  isLoading: boolean;
  isTrash: boolean;
  onRefresh: () => void;
  orderBy?: string;
  sort?: string;
  onSortChange?: (field: string) => void;
}

function SortIcon({ field, orderBy, sort }: { field: string; orderBy?: string; sort?: string }) {
  if (orderBy !== field) return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-40" />;
  return sort === 'asc'
    ? <ArrowUp className="ml-1 h-3 w-3 inline" />
    : <ArrowDown className="ml-1 h-3 w-3 inline" />;
}

export function UsersTable({
  data,
  isLoading,
  isTrash,
  onRefresh,
  orderBy = 'created_at',
  sort = 'desc',
  onSortChange,
}: UsersTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activationTarget, setActivationTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [forceDeleteTarget, setForceDeleteTarget] = useState<User | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<User | null>(null);

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => onSortChange?.('name')}
              >
                {t('users.name')}
                <SortIcon field="name" orderBy={orderBy} sort={sort} />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => onSortChange?.('email')}
              >
                {t('users.email')}
                <SortIcon field="email" orderBy={orderBy} sort={sort} />
              </TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead
                className="hidden md:table-cell cursor-pointer select-none"
                onClick={() => onSortChange?.('created_at')}
              >
                {t('users.createdAt')}
                <SortIcon field="created_at" orderBy={orderBy} sort={sort} />
              </TableHead>
              <TableHead>{t('users.type')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {t('common.noData')}
                </TableCell>
              </TableRow>
            ) : (
              data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <p className="font-medium truncate max-w-[200px]">{user.name}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </TableCell>
                  <TableCell>
                    <UserStatusBadge status={user.is_active} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {user.email_verified_at
                        ? new Date(user.email_verified_at).toLocaleDateString()
                        : '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs capitalize text-muted-foreground">{user.type}</span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isTrash ? (
                          <>
                            <DropdownMenuItem onClick={() => setRestoreTarget(user)}>
                              <RefreshCcw className="me-2 h-4 w-4" />
                              {t('users.restore')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setForceDeleteTarget(user)}
                            >
                              <Trash className="me-2 h-4 w-4" />
                              {t('users.forceDelete')}
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => navigate('/users/' + user.id)}>
                              <Eye className="me-2 h-4 w-4" />
                              {t('common.view')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setActivationTarget(user)}>
                              <Pencil className="me-2 h-4 w-4" />
                              {Boolean(user.is_active) ? t('users.deactivate') : t('users.activate')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteTarget(user)}
                            >
                              <Trash2 className="me-2 h-4 w-4" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {activationTarget && (
        <UserActivationDialog
          userId={activationTarget.id}
          userName={activationTarget.name}
          currentStatus={activationTarget.is_active}
          open={!!activationTarget}
          onOpenChange={(open) => { if (!open) setActivationTarget(null); }}
          onActivated={onRefresh}
        />
      )}

      {deleteTarget && (
        <UserDeleteDialog
          userId={deleteTarget.id}
          userName={deleteTarget.name}
          open={!!deleteTarget}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
          onDeleted={onRefresh}
        />
      )}

      {forceDeleteTarget && (
        <UserForceDeleteDialog
          userId={forceDeleteTarget.id}
          userName={forceDeleteTarget.name}
          open={!!forceDeleteTarget}
          onOpenChange={(open) => { if (!open) setForceDeleteTarget(null); }}
          onDeleted={onRefresh}
        />
      )}

      {restoreTarget && (
        <UserRestoreDialog
          userId={restoreTarget.id}
          userName={restoreTarget.name}
          open={!!restoreTarget}
          onOpenChange={(open) => { if (!open) setRestoreTarget(null); }}
          onRestored={onRefresh}
        />
      )}
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Created At</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-40" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
