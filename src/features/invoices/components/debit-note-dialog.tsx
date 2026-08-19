import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { FileMinus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import {
  debitNoteFormSchema,
  debitNoteFormDefaults,
  toDebitNotePayload,
  type DebitNoteFormValues,
} from '../schemas/invoice.schema';
import { useIssueDebitNote } from '../hooks/use-invoices';
import type { ApiErrorResponse } from '@/shared/api';
import type { InvoiceDetail } from '../types/invoice.types';

interface DebitNoteDialogProps {
  invoice: InvoiceDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DebitNoteDialog({ invoice, open, onOpenChange }: DebitNoteDialogProps) {
  const { t } = useTranslation();
  const issueMutation = useIssueDebitNote();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const form = useForm<DebitNoteFormValues>({
    resolver: zodResolver(debitNoteFormSchema),
    defaultValues: debitNoteFormDefaults,
  });

  const onSubmit = (values: DebitNoteFormValues) => {
    setServerErrors({});
    issueMutation.mutate(
      { id: invoice.id, data: toDebitNotePayload(values) },
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

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof DebitNoteFormValues]?.message as string | undefined;
    const serverErr = serverErrors[field]?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  const isPending = issueMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileMinus className="h-5 w-5" />
            {t('invoices.debitNote.title')}
          </DialogTitle>
          <DialogDescription>{t('invoices.debitNote.subtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('invoices.debitNote.amount')} *</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              {...form.register('amount')}
            />
            {getError('amount') && (
              <p className="text-xs text-destructive">{getError('amount')}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('invoices.debitNote.reason')} *</label>
            <Textarea
              rows={3}
              placeholder={t('invoices.debitNote.reasonPlaceholder')}
              {...form.register('reason')}
            />
            {getError('reason') && (
              <p className="text-xs text-destructive">{getError('reason')}</p>
            )}
          </div>

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
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('invoices.debitNote.submitting')}
                </>
              ) : (
                t('invoices.debitNote.submit')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}