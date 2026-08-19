import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import {
  cancelInvoiceFormSchema,
  cancelInvoiceFormDefaults,
  toCancelInvoicePayload,
  type CancelInvoiceFormValues,
} from '../schemas/invoice.schema';
import { useCancelInvoice } from '../hooks/use-invoices';
import type { ApiErrorResponse } from '@/shared/api';
import type { InvoiceDetail } from '../types/invoice.types';

interface CancelInvoiceDialogProps {
  invoice: InvoiceDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelInvoiceDialog({ invoice, open, onOpenChange }: CancelInvoiceDialogProps) {
  const { t } = useTranslation();
  const cancelMutation = useCancelInvoice();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const form = useForm<CancelInvoiceFormValues>({
    resolver: zodResolver(cancelInvoiceFormSchema),
    defaultValues: cancelInvoiceFormDefaults,
  });

  const onSubmit = (values: CancelInvoiceFormValues) => {
    setServerErrors({});
    cancelMutation.mutate(
      { id: invoice.id, data: toCancelInvoicePayload(values) },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        onError: (error: unknown) => {
          const apiError = error as ApiErrorResponse;
          if (apiError?.status === 422 && apiError.errors) {
            setServerErrors(apiError.errors);
          }
        },
      }
    );
  };

  const errors = form.formState.errors;
  const reasonLength = (useWatch({ control: form.control, name: 'reason' }) ?? '').length;

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof CancelInvoiceFormValues]?.message as string | undefined;
    const serverErr = serverErrors[field]?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  const isPending = cancelMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t('invoices.cancel.title')}
          </DialogTitle>
          <DialogDescription>{t('invoices.cancel.subtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm text-destructive">{t('invoices.cancel.warning')}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('invoices.cancel.reason')} *</label>
            <Textarea
              rows={3}
              placeholder={t('invoices.cancel.reasonPlaceholder')}
              {...form.register('reason')}
            />
            <div className="flex items-center justify-between">
              {getError('reason') ? (
                <p className="text-xs text-destructive">{getError('reason')}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-muted-foreground">
                {reasonLength}/500
              </span>
            </div>
          </div>

          <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-destructive"
              {...form.register('confirm')}
            />
            <span>{t('invoices.cancel.confirmCheckbox')}</span>
          </label>
          {getError('confirm') && (
            <p className="text-xs text-destructive">{getError('confirm')}</p>
          )}

          {Object.keys(serverErrors).length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <ul className="list-inside list-disc space-y-1">
                {Object.entries(serverErrors).map(([field, messages]) =>
                  messages.map((msg, i) => (
                    <li key={`${field}-${i}`} className="text-xs text-destructive">
                      {msg}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('invoices.cancel.submitting')}
                </>
              ) : (
                t('invoices.cancel.submit')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}