import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2, PencilLine } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import {
  correctInvoiceFormSchema,
  toCorrectInvoicePayload,
  type CorrectInvoiceFormValues,
} from '../schemas/invoice.schema';
import { useCorrectInvoice } from '../hooks/use-invoices';
import type { ApiErrorResponse } from '@/shared/api';
import type { InvoiceDetail } from '../types/invoice.types';

interface CorrectInvoiceDialogProps {
  invoice: InvoiceDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function seedDefaults(invoice: InvoiceDetail): CorrectInvoiceFormValues {
  const billing = invoice.billing_address ?? {};
  const shipping = invoice.shipping_address ?? {};
  return {
    reason: '',
    total: invoice.total !== undefined && invoice.total !== null ? String(invoice.total) : '',
    amount_paid:
      invoice.amount_paid !== undefined && invoice.amount_paid !== null
        ? String(invoice.amount_paid)
        : '',
    shipping:
      invoice.shipping !== undefined && invoice.shipping !== null
        ? String(invoice.shipping)
        : invoice.shipping_price !== undefined && invoice.shipping_price !== null
          ? String(invoice.shipping_price)
          : '',
    customer_name: invoice.customer_name ?? invoice.customer?.name ?? '',
    customer_email: invoice.customer_email ?? invoice.customer?.email ?? '',
    customer_phone: invoice.customer?.phone ?? '',
    billing_name: billing.name ?? '',
    billing_line1: billing.line1 ?? billing.street ?? billing.street_address ?? '',
    billing_line2: billing.line2 ?? '',
    billing_city: billing.city ?? '',
    billing_state: billing.state ?? '',
    billing_country: billing.country ?? '',
    billing_postal_code: billing.postal_code ?? '',
    shipping_name: shipping.name ?? '',
    shipping_line1: shipping.line1 ?? shipping.street ?? shipping.street_address ?? '',
    shipping_line2: shipping.line2 ?? '',
    shipping_city: shipping.city ?? '',
    shipping_state: shipping.state ?? '',
    shipping_country: shipping.country ?? '',
    shipping_postal_code: shipping.postal_code ?? '',
    notes: invoice.notes_override ?? invoice.notes ?? '',
  };
}

export function CorrectInvoiceDialog({ invoice, open, onOpenChange }: CorrectInvoiceDialogProps) {
  const { t } = useTranslation();
  const correctMutation = useCorrectInvoice();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<CorrectInvoiceFormValues | null>(null);

  const form = useForm<CorrectInvoiceFormValues>({
    resolver: zodResolver(correctInvoiceFormSchema),
    defaultValues: seedDefaults(invoice),
  });

  const onFormSubmit = (values: CorrectInvoiceFormValues) => {
    setServerErrors({});
    setPendingValues(values);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!pendingValues) return;
    correctMutation.mutate(
      { id: invoice.id, data: toCorrectInvoicePayload(pendingValues) },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          onOpenChange(false);
        },
        onError: (error: unknown) => {
          const apiError = error as ApiErrorResponse;
          setConfirmOpen(false);
          if (apiError?.status === 422 && apiError.errors) {
            setServerErrors(apiError.errors);
          }
        },
      }
    );
  };

  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof CorrectInvoiceFormValues]?.message as string | undefined;
    const serverErr =
      serverErrors[field]?.[0] ||
      serverErrors[`billing_address.${field.replace('billing_', '')}`]?.[0] ||
      serverErrors[`shipping_address.${field.replace('shipping_', '')}`]?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  const isPending = correctMutation.isPending;

  const renderField = (
    field: keyof CorrectInvoiceFormValues,
    label: string,
    type: 'text' | 'number' = 'text'
  ) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <Input
        type={type}
        step={type === 'number' ? '0.01' : undefined}
        {...form.register(field)}
      />
      {getError(field) && <p className="text-xs text-destructive">{getError(field)}</p>}
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PencilLine className="h-5 w-5" />
              {t('invoices.correct.title')}
            </DialogTitle>
            <DialogDescription>{t('invoices.correct.subtitle')}</DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t('invoices.correct.reason')} *
              </label>
              <Textarea
                rows={3}
                placeholder={t('invoices.correct.reasonPlaceholder')}
                {...form.register('reason')}
              />
              {getError('reason') && (
                <p className="text-xs text-destructive">{getError('reason')}</p>
              )}
            </div>

            <fieldset className="rounded-lg border p-3">
              <legend className="px-1 text-sm font-semibold">{t('invoices.correct.financial')}</legend>
              <div className="grid gap-4 sm:grid-cols-3">
                {renderField('total', t('invoices.correct.total'), 'number')}
                {renderField('amount_paid', t('invoices.correct.amountPaid'), 'number')}
                {renderField('shipping', t('invoices.correct.shipping'), 'number')}
              </div>
            </fieldset>

            <fieldset className="rounded-lg border p-3">
              <legend className="px-1 text-sm font-semibold">{t('invoices.correct.customer')}</legend>
              <div className="grid gap-4 sm:grid-cols-3">
                {renderField('customer_name', t('invoices.correct.customerName'))}
                {renderField('customer_email', t('invoices.correct.customerEmail'))}
                {renderField('customer_phone', t('invoices.correct.customerPhone'))}
              </div>
            </fieldset>

            <fieldset className="rounded-lg border p-3">
              <legend className="px-1 text-sm font-semibold">
                {t('invoices.correct.billingAddress')}
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                {renderField('billing_name', t('invoices.correct.addrName'))}
                {renderField('billing_line1', t('invoices.correct.addrLine1'))}
                {renderField('billing_line2', t('invoices.correct.addrLine2'))}
                {renderField('billing_city', t('invoices.correct.addrCity'))}
                {renderField('billing_state', t('invoices.correct.addrState'))}
                {renderField('billing_country', t('invoices.correct.addrCountry'))}
                {renderField('billing_postal_code', t('invoices.correct.addrPostal'))}
              </div>
            </fieldset>

            <fieldset className="rounded-lg border p-3">
              <legend className="px-1 text-sm font-semibold">
                {t('invoices.correct.shippingAddress')}
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                {renderField('shipping_name', t('invoices.correct.addrName'))}
                {renderField('shipping_line1', t('invoices.correct.addrLine1'))}
                {renderField('shipping_line2', t('invoices.correct.addrLine2'))}
                {renderField('shipping_city', t('invoices.correct.addrCity'))}
                {renderField('shipping_state', t('invoices.correct.addrState'))}
                {renderField('shipping_country', t('invoices.correct.addrCountry'))}
                {renderField('shipping_postal_code', t('invoices.correct.addrPostal'))}
              </div>
            </fieldset>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('invoices.correct.notes')}</label>
              <Textarea
                rows={3}
                placeholder={t('invoices.correct.notesPlaceholder')}
                {...form.register('notes')}
              />
              {getError('notes') && (
                <p className="text-xs text-destructive">{getError('notes')}</p>
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
                {t('invoices.correct.submit')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('invoices.correct.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('invoices.correct.confirmDescription', { invoice: invoice.invoice_number })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)} disabled={isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('invoices.correct.submitting')}
                </>
              ) : (
                t('invoices.correct.confirmSubmit')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}