import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useAdminOrderStatuses, useUpdateOrdersStatusBatch } from '../hooks/use-orders';
import { getLocalizedName } from '@/shared/lib/localize';
import type { BatchStatusData, FlowValues } from '../types/order.types';

interface BulkStatusDialogProps {
  orderIds: number[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBatchComplete?: (data: BatchStatusData) => void;
}

export function BulkStatusDialog({
  orderIds,
  open,
  onOpenChange,
  onBatchComplete,
}: BulkStatusDialogProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const batchMutation = useUpdateOrdersStatusBatch();
  const { data: catalogData, isLoading: catalogLoading } = useAdminOrderStatuses();
  const catalog = catalogData?.data?.data || [];
  const [status, setStatus] = useState('');
  const [flowValues, setFlowValues] = useState<FlowValues>({});
  const [results, setResults] = useState<BatchStatusData | null>(null);

  const canSubmit = status && orderIds.length > 0 && !batchMutation.isPending;

  const handleSubmit = () => {
    batchMutation.mutate(
      { orderIds, status, flowValues: Object.keys(flowValues).length ? flowValues : undefined },
      {
        onSuccess: (response) => {
          if (response.data) setResults(response.data);
          onBatchComplete?.(response.data as BatchStatusData);
        },
      }
    );
  };

  const handleRetryFailed = () => {
    if (!results) return;
    const failedIds = results.results
      .filter((r) => !r.success)
      .map((r) => r.order_id);
    if (failedIds.length === 0) return;
    setResults(null);
    batchMutation.mutate(
      { orderIds: failedIds, status, flowValues: Object.keys(flowValues).length ? flowValues : undefined },
      {
        onSuccess: (response) => {
          if (response.data) setResults(response.data);
        },
      }
    );
  };

  const close = () => {
    setResults(null);
    setStatus('');
    setFlowValues({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('orders.bulkStatusTitle', { count: orderIds.length })}</DialogTitle>
          <DialogDescription>{t('orders.bulkStatusDescription')}</DialogDescription>
        </DialogHeader>

        {results ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>
                {t('orders.batchSummary', {
                  succeeded: results.summary.succeeded,
                  total: results.summary.total,
                })}
              </span>
            </div>
            <div className="max-h-60 space-y-1.5 overflow-y-auto rounded-lg border p-2">
              {results.results.map((r) => (
                <div
                  key={r.order_id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="font-medium">#{r.order_id}</span>
                  {r.success ? (
                    <Badge className="bg-success-soft text-success border-transparent">
                      {r.status}
                    </Badge>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-destructive">
                      <XCircle className="h-3.5 w-3.5" />
                      {t(`orders.batchErrors.${r.error?.code}`, {
                        defaultValue: r.error?.message,
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              {results.summary.failed > 0 && (
                <Button variant="outline" onClick={handleRetryFailed}>
                  {t('orders.retryFailed')}
                </Button>
              )}
              <Button onClick={close}>{t('common.done')}</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>{t('orders.newStatus')}</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value ?? '')}
                  disabled={catalogLoading}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue
                      placeholder={
                        catalogLoading
                          ? t('common.loading')
                          : t('orders.selectStatus')
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="w-auto min-w-[260px]">
                    {catalog.map((item) => (
                      <SelectItem
                        key={item.id}
                        value={item.code}
                        className="[&>span]:whitespace-normal [&>span]:items-start"
                      >
                        <span className="flex items-start justify-between gap-4 pe-2">
                          <span className="break-words leading-snug">
                            {getLocalizedName(item.name, lang)}
                          </span>
                          <code className="shrink-0 text-xs text-muted-foreground">
                            {item.code}
                          </code>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('orders.batchNote')}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={close}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                {batchMutation.isPending && (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                )}
                {t('orders.applyTo', { count: orderIds.length })}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
