import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Separator } from '@/shared/ui/separator';
import type { DigitalEntitlement } from '../types/digital-entitlement.types';
import {
  EntitlementDate,
  EntitlementQuotaLabel,
  EntitlementStatusBadge,
} from './entitlement-bits';
import { Loader2 } from 'lucide-react';
import { useEntitlement } from '../hooks/use-digital-entitlements';

interface EntitlementDetailDialogProps {
  entitlement: DigitalEntitlement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * One ticket opened from the table row. Always refreshes through the SHOW
 * endpoint so the dialog carries the eager-loaded owner + product snapshots
 * (the list already has them, but revocations while the dialog is open stay
 * fresh too).
 */
export function EntitlementDetailDialog({
  entitlement,
  open,
  onOpenChange,
}: EntitlementDetailDialogProps) {
  const { t } = useTranslation();
  const uuid = entitlement?.uuid ?? '';
  const { data, isFetching } = useEntitlement(open ? uuid : undefined);
  const fresh = data?.data ?? entitlement;

  const rows: { label: string; value: React.ReactNode }[] = fresh
    ? [
        { label: t('entitlements.detail.uuid'), value: <span className="font-mono text-xs">{fresh.uuid}</span> },
        { label: t('entitlements.table.owner'), value: `${fresh.user?.name ?? '—'} (${fresh.user?.email ?? '—'})` },
        { label: t('entitlements.detail.ownerId'), value: fresh.user?.id ?? '—' },
        { label: t('entitlements.detail.product'), value: fresh.product?.name ?? '—' },
        { label: t('entitlements.detail.productId'), value: fresh.product?.id ?? '—' },
        { label: t('entitlements.detail.orderId'), value: fresh.order_id },
        { label: t('entitlements.detail.orderProductId'), value: fresh.order_product_id },
        {
          label: t('entitlements.table.quota'),
          value: <EntitlementQuotaLabel count={fresh.download_count} limit={fresh.download_limit} />,
        },
        { label: t('entitlements.detail.deliveredAt'), value: <EntitlementDate value={fresh.delivered_at} /> },
        { label: t('entitlements.detail.revokedAt'), value: <EntitlementDate value={fresh.revoked_at} /> },
        { label: t('entitlements.detail.expiresAt'), value: <EntitlementDate value={fresh.expires_at} /> },
        { label: t('entitlements.detail.createdAt'), value: <EntitlementDate value={fresh.created_at} /> },
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('entitlements.detail.title')}
            {fresh && <EntitlementStatusBadge status={fresh.status} />}
            {isFetching && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </DialogTitle>
          <DialogDescription>{t('entitlements.detail.subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={row.label}>
              {i > 0 && <Separator className="my-2" />}
              <div className="flex items-start justify-between gap-4">
                <span className="shrink-0 text-xs text-muted-foreground">{row.label}</span>
                <span className="min-w-0 break-all text-end text-sm font-medium">{row.value}</span>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
