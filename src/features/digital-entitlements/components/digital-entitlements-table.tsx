import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Eye, ArrowUpToLine, Ban, Undo2 } from 'lucide-react';
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
import { DataEmptyState } from '@/shared/components/data-state';
import { usePermissions } from '@/shared/auth/guards';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useRevokeEntitlement, useRestoreEntitlement } from '../hooks/use-digital-entitlements';
import type { DigitalEntitlement } from '../types/digital-entitlement.types';
import {
  EntitlementDate,
  EntitlementQuotaLabel,
  EntitlementStatusBadge,
} from './entitlement-bits';
import { EntitlementDetailDialog } from './entitlement-detail-dialog';
import { EntitlementLimitDialog } from './entitlement-limit-dialog';
import { RevokeRestoreConfirm } from './revoke-restore-confirm';

interface EntitlementsTableProps {
  data: DigitalEntitlement[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function EntitlementsTable({ data, isLoading, onRefresh }: EntitlementsTableProps) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.digitalEntitlements.manage);

  const [detail, setDetail] = useState<DigitalEntitlement | null>(null);
  const [limitTarget, setLimitTarget] = useState<DigitalEntitlement | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<DigitalEntitlement | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<DigitalEntitlement | null>(null);

  const revokeMutation = useRevokeEntitlement();
  const restoreMutation = useRestoreEntitlement();

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <>
      <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('entitlements.table.ticket')}</TableHead>
              <TableHead>{t('entitlements.table.owner')}</TableHead>
              <TableHead>{t('entitlements.table.product')}</TableHead>
              <TableHead>{t('entitlements.table.status')}</TableHead>
              <TableHead>{t('entitlements.table.quota')}</TableHead>
              <TableHead>{t('entitlements.table.created')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <DataEmptyState title={t('entitlements.empty')} className="border-0" />
                </TableCell>
              </TableRow>
            ) : (
              data.map((entitlement) => (
                <TableRow key={entitlement.uuid}>
                  <TableCell>
                    <span className="block max-w-40 truncate font-mono text-xs">
                      {entitlement.uuid}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      #{entitlement.order_id}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {entitlement.user?.name ?? '—'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {entitlement.user?.email ?? ''}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="truncate text-sm font-medium">
                      {entitlement.product?.name ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <EntitlementStatusBadge status={entitlement.status} />
                  </TableCell>
                  <TableCell>
                    <EntitlementQuotaLabel
                      count={entitlement.download_count}
                      limit={entitlement.download_limit}
                    />
                  </TableCell>
                  <TableCell>
                    <EntitlementDate value={entitlement.created_at} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDetail(entitlement)}>
                          <Eye className="me-2 h-4 w-4" />
                          {t('common.view')}
                        </DropdownMenuItem>
                        {canManage && (
                          <DropdownMenuItem onClick={() => setLimitTarget(entitlement)}>
                            <ArrowUpToLine className="me-2 h-4 w-4" />
                            {t('entitlements.limitAction')}
                          </DropdownMenuItem>
                        )}
                        {canManage && entitlement.status !== 'revoked' && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setRevokeTarget(entitlement)}
                          >
                            <Ban className="me-2 h-4 w-4" />
                            {t('entitlements.revokeAction')}
                          </DropdownMenuItem>
                        )}
                        {canManage && entitlement.status === 'revoked' && (
                          <DropdownMenuItem onClick={() => setRestoreTarget(entitlement)}>
                            <Undo2 className="me-2 h-4 w-4" />
                            {t('entitlements.restoreAction')}
                          </DropdownMenuItem>
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

      <EntitlementDetailDialog
        entitlement={detail}
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      />

      <EntitlementLimitDialog
        key={limitTarget?.uuid ?? 'limit'}
        entitlement={limitTarget}
        open={!!limitTarget}
        onOpenChange={(open) => {
          if (!open) setLimitTarget(null);
        }}
        onSaved={onRefresh}
      />

      <RevokeRestoreConfirm
        mode="revoke"
        entitlement={revokeTarget}
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        loading={revokeMutation.isPending}
        onConfirm={async () => {
          if (!revokeTarget) return;
          await revokeMutation.mutateAsync(revokeTarget.uuid);
          setRevokeTarget(null);
          onRefresh();
        }}
      />

      <RevokeRestoreConfirm
        mode="restore"
        entitlement={restoreTarget}
        open={!!restoreTarget}
        onOpenChange={(open) => {
          if (!open) setRestoreTarget(null);
        }}
        loading={restoreMutation.isPending}
        onConfirm={async () => {
          if (!restoreTarget) return;
          await restoreMutation.mutateAsync(restoreTarget.uuid);
          setRestoreTarget(null);
          onRefresh();
        }}
      />
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Quota</TableHead>
            <TableHead>Date</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-36" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-1 h-3 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-14" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
