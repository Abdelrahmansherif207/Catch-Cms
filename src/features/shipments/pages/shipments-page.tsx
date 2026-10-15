import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Ship } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { SelectCheckbox } from '@/shared/components/select-checkbox';
import { BulkSelectionBar } from '@/shared/components/bulk-selection-bar';
import { useFulfillment } from '@/features/fulfillments/hooks/use-fulfillments';
import { DataEmptyState, DataErrorState } from '@/shared/components/data-state';
import { PageHeader } from '@/shared/components/page-header';
import { fulfillmentRoutes } from '@/features/fulfillments/routes/fulfillment.routes';
import {
  isDispatchable,
  isDeliverable,
  isShipmentCancellable,
} from '../types/shipment.types';
import { shipmentRoutes } from '../routes/shipment.routes';
import { ShipmentStatusBadge } from '../components/shipment-status-badge';
import {
  useShipments,
  useBulkShipmentAction,
} from '../hooks/use-shipments';
const LIST_LIMIT = 100;

/**
 * Shipments management (GET /admin/shipments is FULFILLMENT-scoped — the
 * contract requires ?fulfillment_id), so the page tabs a fulfillment first:
 * numeric id picker, then that fulfillment's shipment page with per-row and
 * per-fulfillment BULK dispatch/deliver (bulk endpoints are update-shipment
 * gated with no scope — failures surface per-item verbatim).
 */
export function ShipmentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramId = searchParams.get('fulfillment_id');

  const fulfillledId = paramId && /^\d+$/.test(paramId) ? Number(paramId) : null;

  const [pickInput, setPickInput] = useState(fulfillledId ? String(fulfillledId) : '');

  const loadFulfillment = useCallback(
    (id: number | null) => {
      if (id === null) {
        setSearchParams({}, { replace: true });
        navigate(shipmentRoutes.list, { replace: true });
      } else {
        setSearchParams({ fulfillment_id: String(id) }, { replace: true });
      }
    },
    [setSearchParams, navigate]
  );

  const { data: fulfillmentResponse, isError: fulfillmentError } =
    useFulfillment(fulfillledId ?? undefined);
  const fulfillment = fulfillmentResponse?.data;

  // ALWAYS loaded — bare /admin/shipments shows ALL shipments in scope;
  // picking a fulfillment only narrows the same table (optional filter).
  const { data, isError, refetch } = useShipments({
    fulfillmentId: fulfillledId ?? undefined,
    limit: LIST_LIMIT,
  });
  const shipments = data?.data ?? [];

  // ── per-fulfillment bulk state ──
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkNotes, setBulkNotes] = useState('');
  const bulkDispatchMutation = useBulkShipmentAction('dispatch');
  const bulkDeliverMutation = useBulkShipmentAction('deliver');

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((rows: { id: number }[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const row of rows) {
        if (checked) next.add(row.id);
        else next.delete(row.id);
      }
      return next;
    });
  }, []);

  // Only the selected rows the ENGINE accepts for each action count here.
  const selectedRows = useMemo(
    () =>
      Array.from(selectedIds)
        .map((id) => shipments.find((row) => row.id === id))
        .filter((row) => row !== undefined),
    [shipments, selectedIds]
  );
  const dispatchCandidates = selectedRows.filter((row) => isDispatchable(row.status));
  const deliverCandidates = selectedRows.filter((row) => isDeliverable(row.status));
  const bulkPending = bulkDispatchMutation.isPending || bulkDeliverMutation.isPending;

  const runBulk = (kind: 'dispatch' | 'deliver') => {
    const ids =
      kind === 'dispatch'
        ? dispatchCandidates.map((row) => row.id)
        : deliverCandidates.map((row) => row.id);
    if (ids.length === 0) return;
    const notes = bulkNotes.trim() || null;
    const mutation =
      kind === 'dispatch' ? bulkDispatchMutation : bulkDeliverMutation;
    mutation.mutate(
      { shipment_ids: ids, notes },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
          setBulkNotes('');
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('shipments.pageTitle')}
        description={t('shipments.pageDescription')}
        actions={
          <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        }
      />

      {/* Optional fulfillment filter — the table below ALWAYS renders, ALL
          shipments load without it; picking a fulfillment only narrows. */}
      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1">
            <p className="mb-1 text-xs text-muted-foreground">
              {t('shipments.pickTitle')}
            </p>
            <Input
              inputMode="numeric"
              placeholder={t('shipments.pickPlaceholder')}
              value={pickInput}
              onChange={(event) =>
                setPickInput(event.target.value.replace(/\D/g, ''))
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter' && /^\d+$/.test(pickInput) && pickInput !== '') {
                  loadFulfillment(Number(pickInput));
                }
              }}
            />
          </div>
          <Button
            onClick={() => {
              if (/^\d+$/.test(pickInput) && pickInput !== '') {
                loadFulfillment(Number(pickInput));
              }
            }}
            disabled={!/^\d+$/.test(pickInput) || pickInput === ''}
          >
            <Ship className="me-1.5 h-4 w-4" />
            {t('shipments.pickAction')}
          </Button>
          {fulfillledId !== null && (
            <Button variant="ghost" onClick={() => loadFulfillment(null)}>
              {t('shipments.showAll')}
            </Button>
          )}
        </div>
        {fulfillledId !== null && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {fulfillmentError && (
              <span className="text-destructive">
                {t('shipments.fulfillmentNotFound', { id: fulfillledId })}
              </span>
            )}
            {fulfillment && (
              <>
                <span className="font-mono font-medium">
                  {fulfillment.fulfillment_number}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                  {fulfillment.status}
                </span>
                <Link
                  to={fulfillmentRoutes.detail(fulfillment.id)}
                  className="text-xs text-primary hover:underline"
                >
                  {t('shipments.openFulfillment')}
                </Link>
              </>
            )}
          </div>
        )}
      </section>

      {/* Bulk bar — one selection pool across ALL loaded shipments; the
          two actions draw their own eligible subsets. */}
      {selectedIds.size > 0 && (
        <BulkSelectionBar
          count={selectedIds.size}
          cap={100}
          chips={selectedRows.map((row) => ({ id: row.id, label: '#' + row.id }))}
          onRemoveChip={toggleSelect}
          onClear={() => setSelectedIds(new Set())}
          heading={t('shipments.bulkHeading')}
        >
          <Input
            className="h-8 w-44"
            maxLength={500}
            placeholder={t('shipments.bulkNotes')}
            value={bulkNotes}
            onChange={(event) => setBulkNotes(event.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={dispatchCandidates.length === 0 || bulkPending}
            onClick={() => runBulk('dispatch')}
          >
            {t('shipments.bulkDispatchAction', { count: dispatchCandidates.length })}
          </Button>
          <Button
            size="sm"
            disabled={deliverCandidates.length === 0 || bulkPending}
            onClick={() => runBulk('deliver')}
          >
            {t('shipments.bulkDeliverAction', { count: deliverCandidates.length })}
          </Button>
        </BulkSelectionBar>
      )}
      {/* Status/error/empty ALL render through the SAME always-present
          table — a missing fulfillment filter is a spec state, not a blank
          page. */}
      {isError ? (
        <DataErrorState message={t('shipments.listError')} onRetry={() => refetch()} />
      ) : shipments.length === 0 ? (
        <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
          <Table>
            <ShipmentsTableHeader rows={shipments} selectedIds={selectedIds} onAll={toggleAll} />
            <TableBody>
              <TableRow>
                <TableCell colSpan={8}>
                  <DataEmptyState className="border-0" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
          <Table>
            <ShipmentsTableHeader rows={shipments} selectedIds={selectedIds} onAll={toggleAll} />
            <TableBody>
              {shipments.map((shipment) => (
                <TableRow
                  key={shipment.id}
                  className={
                    selectedIds.has(shipment.id)
                      ? 'bg-primary/10 shadow-[inset_2px_0_0_0_var(--primary)]'
                      : undefined
                  }
                >
                  <TableCell>
                    <SelectCheckbox
                      checked={selectedIds.has(shipment.id)}
                      onCheckedChange={() => toggleSelect(shipment.id)}
                      disabled={
                        !isDispatchable(shipment.status) &&
                        !isDeliverable(shipment.status) &&
                        !isShipmentCancellable(shipment.status)
                      }
                      ariaLabel={'#' + shipment.id}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      to={shipmentRoutes.detail(shipment.id)}
                      className="font-mono text-sm font-medium hover:underline"
                    >
                      #{shipment.id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ShipmentStatusBadge status={shipment.status} />
                  </TableCell>
                  <TableCell className="text-sm">{shipment.courier ?? '—'}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                    {shipment.shipping_method ?? '—'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {shipment.tracking_number ?? '—'}
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                    {shipment.created_at
                      ? new Date(shipment.created_at).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell className="text-end">
                    <Link
                      to={shipmentRoutes.detail(shipment.id)}
                      className="text-xs text-primary hover:underline"
                    >
                      {t('shipments.openDetail')}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {t('shipments.selectionHint')}
      </p>
    </div>
  );
}

function ShipmentsTableHeader({
  rows,
  selectedIds,
  onAll,
}: {
  rows: { id: number }[];
  selectedIds: Set<number>;
  onAll: (rows: { id: number }[], checked: boolean) => void;
}) {
  const { t } = useTranslation();
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.id));
  const someSelected = rows.some((row) => selectedIds.has(row.id));

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-10">
          <SelectCheckbox
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onCheckedChange={(checked) => onAll(rows, checked)}
            ariaLabel={t('common.selectAll')}
          />
        </TableHead>
        <TableHead>#</TableHead>
        <TableHead>{t('common.status')}</TableHead>
        <TableHead>{t('shipments.courier')}</TableHead>
        <TableHead>{t('shipments.method')}</TableHead>
        <TableHead>{t('shipments.tracking')}</TableHead>
        <TableHead className="hidden sm:table-cell">{t('shipments.created')}</TableHead>
        <TableHead />
      </TableRow>
    </TableHeader>
  );
}
