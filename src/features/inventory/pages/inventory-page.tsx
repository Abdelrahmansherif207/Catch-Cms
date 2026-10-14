import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRightLeft, Boxes, PackagePlus, Warehouse } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/components/page-header';
import { CardSection } from '@/shared/components/card-section';
import { useLocations } from '@/features/locations/hooks/use-locations';
import { useWarehouses } from '@/features/warehouses/hooks/use-warehouses';
import { ReceiveStockModal } from '../components/receive-stock-modal';
import { TransferStockModal } from '../components/transfer-stock-modal';

/**
 * Action hub for the two WMS stock write endpoints (receipts + transfers).
 * Layout: stats bar (backend-derived figures) + two action cards, each
 * opening a CENTERED TWO-STEP MODAL (product list → stock fields). No
 * duplicated quick buttons — one entry point per action.
 *
 * NOT rendered anywhere here: an activity/audit feed and any "transactions
 * today" stat — the backend writes that ledger but exposes NO read endpoint
 * for it (Apidog refresh 2026-10-13). When a `GET /admin/stock-operations`
 * ships, its list response plugs in EXACTLY here and the stats bar gains the
 * transactions chip — nothing else in this file changes.
 */
export function InventoryPage() {
  const { t } = useTranslation();
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const { data: locationsData, isLoading: binsLoading } = useLocations({
    limit: 100,
  });
  const { data: warehousesData, isLoading: warehousesLoading } = useWarehouses({
    limit: 100,
  });

  const bins = locationsData?.data ?? [];
  const activeBins = bins.filter((bin) => bin.status === 'active').length;
  const warehousesCount = warehousesData?.data?.length ?? 0;

  const stats = [
    {
      icon: Boxes,
      label: t('inventory.stats.totalBins'),
      value: binsLoading ? null : bins.length,
    },
    {
      icon: Boxes,
      label: t('inventory.stats.activeBins'),
      value: binsLoading ? null : activeBins,
    },
    {
      icon: Warehouse,
      label: t('inventory.stats.totalWarehouses'),
      value: warehousesLoading ? null : warehousesCount,
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
              {stat.value === null ? (
                <span className="mt-1 block h-6 w-10 animate-pulse rounded bg-muted" />
              ) : (
                <p className="text-2xl font-semibold leading-6 text-foreground">
                  {stat.value}
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

      <ReceiveStockModal open={receiveOpen} onOpenChange={setReceiveOpen} />
      <TransferStockModal open={transferOpen} onOpenChange={setTransferOpen} />
    </div>
  );
}
