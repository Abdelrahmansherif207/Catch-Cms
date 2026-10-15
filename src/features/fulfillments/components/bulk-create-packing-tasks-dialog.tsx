import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, PackageCheck, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { FulfillmentStatusBadge } from './fulfillment-status-badge';
import { useBulkCreatePackingTasks } from '../hooks/use-fulfillments';
import type {
  BulkCreatePackingTasksResult,
  FulfillmentListItem,
} from '../types/fulfillment.types';

interface BulkCreatePackingTasksDialogProps {
  /** Rows selected on the list page — still visible/refetched order. */
  selected: FulfillmentListItem[];
  /** Server cap: 1–100 fulfillment ids. */
  maxCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Bulk create packing tasks (POST /admin/fulfillments/create-packing-tasks):
 * ALWAYS 200 — eligible rows progress, the rest land in `failed[]` with
 * their verbatim refusal/miss reason. The result view mirrors the bulk
 * release dialog so operators compare outcomes straight away. The station
 * is intentionally not supplied (wave-1 contract: tasks stay unassigned).
 */
export function BulkCreatePackingTasksDialog({
  selected,
  maxCount,
  open,
  onOpenChange,
  onSuccess,
}: BulkCreatePackingTasksDialogProps) {
  const { t } = useTranslation();
  const bulkMutation = useBulkCreatePackingTasks();
  const [results, setResults] = useState<BulkCreatePackingTasksResult | null>(null);

  if (!open) return null;

  const overCap = selected.length > maxCount;

  const handleSubmit = () => {
    bulkMutation.mutate(
      {
        fulfillment_ids: selected.map((row) => row.id),
        packing_station_id: null,
      },
      {
        onSuccess: (response) => {
          setResults(response.data);
          onSuccess();
        },
      }
    );
  };

  const handleClose = () => onOpenChange(false);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {results === null ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-primary" />
                {t('fulfillments.bulkPackingTitle')}
              </DialogTitle>
              <DialogDescription>
                {t('fulfillments.bulkPackingDescription', { count: selected.length })}
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[50vh] space-y-3 overflow-y-auto pe-1">
              <p className="text-sm font-medium">
                {t('fulfillments.bulkPackingSelected', { count: selected.length })}
              </p>
              <div className="rounded-lg border divide-y overflow-hidden">
                {selected.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span className="font-mono">{row.fulfillment_number}</span>
                    <FulfillmentStatusBadge status={row.status} />
                  </div>
                ))}
              </div>
              {overCap && (
                <p className="text-xs text-warning">
                  {t('fulfillments.bulkPackingOverCap', { max: maxCount })}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={bulkMutation.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={bulkMutation.isPending || overCap}
              >
                {bulkMutation.isPending
                  ? t('fulfillments.bulkPackingStarting')
                  : t('fulfillments.bulkPackingAction')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('fulfillments.bulkPackingResultsTitle')}</DialogTitle>
              <DialogDescription>
                {t('fulfillments.bulkPackingResultsSummary', {
                  created: results.summary.success_count,
                  failed: results.summary.failed_count,
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[50vh] space-y-3 overflow-y-auto pe-1">
              {results.successful.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-success">
                    {t('fulfillments.bulkPackingCreatedList', {
                      count: results.successful.length,
                    })}
                  </p>
                  <div className="rounded-lg border divide-y overflow-hidden">
                    {results.successful.map((row) => (
                      <div
                        key={row.fulfillment_id}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span className="font-medium">{row.fulfillment_number}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {t('fulfillments.bulkPackingTask', { id: row.packing_task_id })}
                          </span>
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                            {row.status}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.failed.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-destructive">
                    {t('fulfillments.bulkPackingFailedList', {
                      count: results.failed.length,
                    })}
                  </p>
                  <div className="rounded-lg border divide-y overflow-hidden">
                    {results.failed.map((row) => (
                      <div
                        key={row.fulfillment_id}
                        className="flex items-start gap-2 px-3 py-2 text-sm"
                      >
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                        <div className="min-w-0">
                          <p className="font-medium">
                            {row.fulfillment_number ?? '#' + row.fulfillment_id}
                          </p>
                          <p className="text-xs text-muted-foreground">{row.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" onClick={handleClose}>
                {t('common.close')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
