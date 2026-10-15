import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  PackagePlus,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { DataErrorState } from '@/shared/components/data-state';
import type {
  StockOperationLedgerRow,
  StockOperationsResponse,
} from '../types/inventory.types';

interface StockOperationsFeedProps {
  query: {
    data?: StockOperationsResponse;
    isLoading: boolean;
    isError: boolean;
    error?: { message?: string } | null;
    refetch: () => void;
  };
  limit?: number;
}

function relTime(value: string | null, locale: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return date.toLocaleString(locale, sameDay
    ? { hour: '2-digit', minute: '2-digit' }
    : { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }: { status: StockOperationLedgerRow['status'] }) {
  const { t } = useTranslation();
  if (status === 'completed') {
    return (
      <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/10 font-normal text-primary">
        <CheckCircle2 className="h-3 w-3" />
        {t('inventory.feed.status.completed')}
      </Badge>
    );
  }
  if (status === 'processing') {
    return (
      <Badge variant="outline" className="gap-1 border-warning/40 bg-warning/10 font-normal text-warning">
        <Clock className="h-3 w-3" />
        {t('inventory.feed.status.processing')}
      </Badge>
    );
  }
  if (status === 'failed') {
    return (
      <Badge variant="outline" className="gap-1 border-destructive/40 bg-destructive/10 font-normal text-destructive">
        <XCircle className="h-3 w-3" />
        {t('inventory.feed.status.failed')}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="font-normal text-muted-foreground">
      {String(status)}
    </Badge>
  );
}

function RowGlyph({ operation }: { operation: StockOperationLedgerRow['operation'] }) {
  const Icon =
    operation === 'receipt' ? PackagePlus : operation === 'transfer' ? ArrowRight : Boxes;
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  );
}

/**
 * Recent-activity feed rendered from the stock operations ledger
 * (GET /admin/inventory/operations — flat data array, newest first; the
 * server exposes no pagination, so the feed trims client-side to `limit`).
 * Rendering only — the hook and refresh button belong to the page.
 */
export function StockOperationsFeed({ query, limit = 10 }: StockOperationsFeedProps) {
  const { t, i18n } = useTranslation();

  if (query.isError) {
    return (
      <DataErrorState
        message={query.error?.message}
        onRetry={() => query.refetch()}
      />
    );
  }

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-muted" />
            <span className="h-4 flex-1 animate-pulse rounded bg-muted" />
            <span className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  const rows = (query.data?.data ?? []).slice(0, limit);

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('inventory.feed.empty')}
      </p>
    );
  }

  return (
    <div className="divide-y">
      {rows.map((row) => {
        const kindLabel =
          row.operation === 'receipt'
            ? t('inventory.feed.receipt')
            : row.operation === 'transfer'
              ? t('inventory.feed.transfer')
              : String(row.operation);
        const productLabel =
          row.product?.name ?? (row.product?.sku ? `${row.product.sku}` : `#${row.product_id}`);
        const bins =
          row.operation === 'transfer'
            ? `${row.source_location?.code ?? '—'} → ${row.destination_location?.code ?? '—'}`
            : row.destination_location
              ? `→ ${row.destination_location.code}`
              : row.source_location
                ? `${row.source_location.code} →`
                : '—';

        return (
          <div key={row.id} className="flex items-center gap-3 py-2.5">
            <RowGlyph operation={row.operation} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">
                <span className="font-medium text-foreground">{kindLabel}</span>
                <span className="mx-1.5 text-muted-foreground">·</span>
                <span className="tabular-nums text-foreground">{row.quantity}</span>
                <span className="mx-1.5 text-muted-foreground">×</span>
                <span>{productLabel}</span>
                <span className="mx-1.5 text-muted-foreground">·</span>
                <span className="font-mono text-xs text-muted-foreground">{bins}</span>
              </p>
              {row.reference && (
                <p className="truncate text-xs text-muted-foreground">
                  {t('inventory.referenceLabel')}: {row.reference}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusBadge status={row.status} />
              <Clock
                className="hidden h-3 w-3 text-muted-foreground sm:block"
                aria-hidden
              />
              <span className="hidden text-xs tabular-nums text-muted-foreground sm:block">
                {relTime(row.created_at, i18n.language)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
