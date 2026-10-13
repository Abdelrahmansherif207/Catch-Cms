import { useTranslation } from 'react-i18next';
import { KeyRound, Clock, Ban, CheckCircle2, Hourglass } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import type { EntitlementStatus } from '../types/digital-entitlement.types';

const STATUS_META: Record<EntitlementStatus, { icon: typeof KeyRound; className: string }> = {
  pending: { icon: Hourglass, className: 'border-transparent bg-warning-soft text-warning' },
  delivered: { icon: CheckCircle2, className: 'border-transparent bg-success-soft text-success' },
  revoked: { icon: Ban, className: 'border-transparent bg-destructive-soft text-destructive' },
};

/** Localized status badge for the entitlement lifecycle states. */
export function EntitlementStatusBadge({ status }: { status: EntitlementStatus }) {
  const { t } = useTranslation();
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  const Icon = meta.icon;
  return (
    <Badge variant="outline" className={`gap-1 ${meta.className}`}>
      <Icon className="h-3 w-3" />
      {t(`entitlements.statuses.${status}`)}
    </Badge>
  );
}

/** Quota label: "2 / 5" or "2 / ∞ (unlimited)". */
export function EntitlementQuotaLabel({
  count,
  limit,
}: {
  count: number;
  limit: number;
}) {
  const { t } = useTranslation();
  if (limit === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-sm">
        {count} / {t('entitlements.unlimited')}
      </span>
    );
  }
  return (
    <span className="text-sm">
      {count} / {limit}
    </span>
  );
}

/** Compact created/updated timestamp cell. */
export function EntitlementDate({ value }: { value: string | null }) {
  if (!value) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <span className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
      <Clock className="h-3.5 w-3.5" />
      {new Date(value).toLocaleString()}
    </span>
  );
}
