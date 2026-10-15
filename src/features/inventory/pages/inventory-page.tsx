import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRightLeft,
  Boxes,
  History,
  PackagePlus,
  RefreshCw,
  Slice,
  Warehouse,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/components/page-header';
import { CardSection } from '@/shared/components/card-section';
import { useInventoryOverview, useStockOperations } from '../hooks/use-inventory';
import { ReceiveStockModal } from '../components/receive-stock-modal';
import { TransferStockModal } from '../components/transfer-stock-modal';
import { StockOperationsFeed } from '../components/stock-operations-feed';
import { cn } from '@/shared/lib/utils';

/**
 * Action hub for the two WMS stock write endpoints (receipts + transfers).
 * Layout: stats bar + two action cards, each opening a CENTERED TWO-STEP
 * MODAL (product list → stock fields). One entry point per action.
 *
 * The stats bar is REAL backend data from GET /admin/inventory/overview
 * (live-verified 2026-10-14 on meem): Total SKU Units is a GLOBAL catalog
 * sum (variant-parent safe), Active bins + Today's transactions are
 * warehouse-scoped, `warehouse_id` echoes the effective scope.
 *
 * NOT rendered anywhere here: an audit feed — the backend writes the
 * operations ledger but exposes NO read for it yet (Apidog refresh
 * 2026-10-13); when a `GET /admin/stock-operations` ships it plugs in
 * exactly here. The empty-bin housekeeping command (DELETE /admin/
 * locations/{id}/products) lives on the LOCATION detail page instead —
 * it acts on the bin it describes.
 */
export function InventoryPage() {
  const { t } = useTranslation();
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const overviewQuery = useInventoryOverview();
  const overview = overviewQuery.data?.data;
  const isLoadingStats = overviewQuery.isPending;
  const operationsQuery = useStockOperations();

  const stats = [
    {
      icon: Boxes,
      label: t('inventory.stats.totalSkuUnits'),
      number: overview?.total_sku_units,
    },
    {
      icon: Warehouse,
      label: t('inventory.stats.activeBins'),
      number: overview?.active_bins,
    },
    {
      icon: Slice,
      label: t('inventory.stats.todayTransactions'),
      number: overview?.today_transactions,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('sidebar.inventory')}
        description={t('inventory.pageDescription')}
        crumbs={[
          { label: t('sidebar.fulfillment'), to: undefined },
          { label: t('sidebar.inventory') },
        ]}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-card sm:p-5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <stat.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-muted-foreground">
                {stat.label}
              </p>
              {isLoadingStats ? (
                <span className="mt-1 block h-6 w-10 animate-pulse rounded bg-muted" />
              ) : (
                <p className="text-2xl font-semibold leading-6 text-foreground">
                  {overviewQuery.isError
                    ? '—'
                    : (stat.number ?? 0).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CardSection
          title={t('inventory.receiveTitle')}
          description={t('inventory.receiveDescription')}
          icon={PackagePlus}
        >
          <Button className="mt-1 w-full" onClick={() => setReceiveOpen(true)}>
            <PackagePlus className="me-1.5 h-4 w-4" />
            {t('inventory.receiveBtn')}
          </Button>
        </CardSection>

        <CardSection
          title={t('inventory.transferTitle')}
          description={t('inventory.transferDescription')}
          icon={ArrowRightLeft}
        >
          <Button variant="outline" className="mt-1 w-full" onClick={() => setTransferOpen(true)}>
            <ArrowRightLeft className="me-1.5 h-4 w-4" />
            {t('inventory.transferBtn')}
          </Button>
        </CardSection>
      </div>

      <CardSection
        title={t('inventory.feedTitle')}
        description={t('inventory.feedSubtitle')}
        icon={History}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => operationsQuery.refetch()}
            disabled={operationsQuery.isFetching}
          >
            <RefreshCw
              className={cn('h-4 w-4', operationsQuery.isFetching && 'animate-spin')}
            />
            <span className="hidden sm:inline">{t('inventory.feedRefresh')}</span>
          </Button>
        }
      >
        <StockOperationsFeed
          query={{
            data: operationsQuery.data,
            isLoading: operationsQuery.isPending,
            isError: operationsQuery.isError,
            error: operationsQuery.error,
            refetch: () => operationsQuery.refetch(),
          }}
          limit={10}
        />
      </CardSection>

      <ReceiveStockModal open={receiveOpen} onOpenChange={setReceiveOpen} />
      <TransferStockModal open={transferOpen} onOpenChange={setTransferOpen} />
    </div>
  );
}
