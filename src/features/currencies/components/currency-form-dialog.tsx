import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, Hash, Globe, DollarSign, MapPin, Settings2, ArrowUpDown } from 'lucide-react';
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
import { Switch } from '@/shared/ui/switch';
import { Skeleton } from '@/shared/ui/skeleton';
import type { ApiErrorResponse } from '@/shared/api';
import {
  currencyFormSchema,
  currencyFormDefaults,
  toApiFormat,
  type CurrencyFormValues,
} from '../schemas/currency.schema';
import { useCreateCurrency, useUpdateCurrency, useCurrency } from '../hooks/use-currencies';
import type { Currency, CurrenciesListResponse } from '../types/currency.types';

interface CurrencyFormDialogProps {
  currency?: Currency | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/* ─── helpers ────────────────────────────────────────────────────────────── */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

function FormSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
      <div className="flex items-center justify-between rounded-md border p-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-9 rounded-full" />
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  error,
  required,
  hint,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      <FieldError message={error} />
    </div>
  );
}

function SectionLabel({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <p className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="h-3 w-3" />
      {label}
    </p>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export function CurrencyFormDialog({
  currency,
  open,
  onOpenChange,
  onSuccess,
}: CurrencyFormDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!currency;
  const { data: currencyDetail, isLoading: isDetailLoading } = useCurrency(currency?.id ?? 0);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CurrencyFormValues>({
    resolver: zodResolver(currencyFormSchema),
    defaultValues: currencyFormDefaults,
  });

  const isActive = watch('is_active');

  /* Populate form when dialog opens or detail data arrives */
  useEffect(() => {
    if (!open) return;
    setServerErrors({});
    if (isEditing && currencyDetail?.data) {
      const c = currencyDetail.data;
      reset({
        code: c.code ?? '',
        nameEn: c.name?.en ?? '',
        nameAr: c.name?.ar ?? '',
        symbolEn: c.symbol?.en ?? '',
        symbolAr: c.symbol?.ar ?? '',
        countryEn: c.country_name?.en ?? '',
        countryAr: c.country_name?.ar ?? '',
        numeric_code: c.numeric_code ?? '',
        decimal_places: c.decimal_places ?? 2,
        icon: c.icon ?? '',
        is_active: c.is_active,
        sort_order: c.sort_order,
      });
    } else if (!isEditing) {
      reset(currencyFormDefaults);
    }
  }, [open, currencyDetail]);

  const createMutation = useCreateCurrency({
    onSuccess: (response: unknown) => {
      toast.success((response as CurrenciesListResponse)?.message || t('currencies.created'));
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const apiError = error as ApiErrorResponse;
      if (apiError?.errors) setServerErrors(apiError.errors);
      else toast.error(apiError?.message || t('currencies.createError'));
    },
  });

  const updateMutation = useUpdateCurrency({
    onSuccess: (response: unknown) => {
      toast.success((response as CurrenciesListResponse)?.message || t('currencies.updated'));
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const apiError = error as ApiErrorResponse;
      if (apiError?.errors) setServerErrors(apiError.errors);
      else toast.error(apiError?.message || t('currencies.updateError'));
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: CurrencyFormValues) => {
    const payload = toApiFormat(data);
    if (isEditing && currency) {
      updateMutation.mutate({ id: currency.id, data: payload as Omit<Currency, 'id'> });
    } else {
      createMutation.mutate(payload as Omit<Currency, 'id'>);
    }
  };

  /* ─── render ─────────────────────────────────────────────────────────── */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] gap-3">

        {/* Header */}
        <DialogHeader className="-mx-4 -mt-4 px-4 pt-4 pb-3 border-b">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold leading-tight">
                {isEditing ? t('currencyForm.editTitle') : t('currencyForm.createTitle')}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isEditing ? t('currencyForm.editSubtitle') : t('currencyForm.createSubtitle')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        {isEditing && isDetailLoading ? (
          <FormSkeleton />
        ) : (
          <form id="currency-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>

            {/* ── Identity ──────────────────────────────────────────── */}
            <div>
              <SectionLabel icon={Hash} label={t('currencyForm.sectionIdentity') || 'Identity'} />
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label={t('currencyForm.code')} required error={errors.code?.message || serverErrors.code?.[0]}>
                  <Input
                    placeholder="USD"
                    maxLength={3}
                    className="uppercase font-mono tracking-widest"
                    {...register('code', {
                      onChange: (e) => { e.target.value = e.target.value.toUpperCase(); },
                    })}
                  />
                </Field>
                <Field label={t('currencyForm.numericCode') || 'Numeric Code'} error={serverErrors.numeric_code?.[0]}>
                  <Input placeholder="840" maxLength={3} {...register('numeric_code')} />
                </Field>
                <Field label={t('currencyForm.icon') || 'Flag Code'} hint="e.g. us, kw, sa" error={serverErrors.icon?.[0]}>
                  <Input placeholder="us" maxLength={4} {...register('icon')} />
                </Field>
              </div>
            </div>

            {/* ── Localized Name ────────────────────────────────────── */}
            <div>
              <SectionLabel icon={Globe} label={t('currencyForm.sectionNames') || 'Name'} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t('currencyForm.nameEn')} required error={errors.nameEn?.message || serverErrors['name.en']?.[0]}>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 start-2.5 flex items-center text-[10px] font-bold text-muted-foreground">EN</span>
                    <Input placeholder="US Dollar" className="ps-8" {...register('nameEn')} />
                  </div>
                </Field>
                <Field label={t('currencyForm.nameAr')} required error={errors.nameAr?.message || serverErrors['name.ar']?.[0]}>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 start-2.5 flex items-center text-[10px] font-bold text-muted-foreground">AR</span>
                    <Input placeholder="دولار أمريكي" dir="rtl" className="ps-8" {...register('nameAr')} />
                  </div>
                </Field>
              </div>
            </div>

            {/* ── Symbol & Country ──────────────────────────────────── */}
            <div>
              <SectionLabel icon={DollarSign} label={t('currencyForm.sectionSymbolCountry') || 'Symbol & Country'} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t('currencyForm.symbolEn') || 'Symbol (EN)'} required error={errors.symbolEn?.message || serverErrors['symbol.en']?.[0]}>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 start-2.5 flex items-center text-[10px] font-bold text-muted-foreground">EN</span>
                    <Input placeholder="$" className="ps-8" {...register('symbolEn')} />
                  </div>
                </Field>
                <Field label={t('currencyForm.symbolAr') || 'Symbol (AR)'} required error={errors.symbolAr?.message || serverErrors['symbol.ar']?.[0]}>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 start-2.5 flex items-center text-[10px] font-bold text-muted-foreground">AR</span>
                    <Input placeholder="$" dir="rtl" className="ps-8" {...register('symbolAr')} />
                  </div>
                </Field>
                <Field label={t('currencyForm.countryEn') || 'Country (EN)'} required icon={MapPin} error={errors.countryEn?.message || serverErrors['country_name.en']?.[0]}>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 start-2.5 flex items-center text-[10px] font-bold text-muted-foreground">EN</span>
                    <Input placeholder="United States" className="ps-8" {...register('countryEn')} />
                  </div>
                </Field>
                <Field label={t('currencyForm.countryAr') || 'Country (AR)'} required icon={MapPin} error={errors.countryAr?.message || serverErrors['country_name.ar']?.[0]}>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 start-2.5 flex items-center text-[10px] font-bold text-muted-foreground">AR</span>
                    <Input placeholder="الولايات المتحدة" dir="rtl" className="ps-8" {...register('countryAr')} />
                  </div>
                </Field>
              </div>
            </div>

            {/* ── Details ───────────────────────────────────────────── */}
            <div>
              <SectionLabel icon={Settings2} label={t('currencyForm.sectionDetails') || 'Details'} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label={t('currencyForm.decimals')}
                  hint="0 – 4 decimal places"
                  error={errors.decimal_places?.message || serverErrors.decimal_places?.[0]}
                >
                  <Input type="number" min={0} max={4} {...register('decimal_places', { valueAsNumber: true })} />
                </Field>
                <Field
                  label={t('currencyForm.sortOrder')}
                  icon={ArrowUpDown}
                  error={errors.sort_order?.message || serverErrors.sort_order?.[0]}
                >
                  <Input type="number" min={0} {...register('sort_order', { valueAsNumber: true })} />
                </Field>
              </div>
            </div>

            {/* ── Active toggle ─────────────────────────────────────── */}
            <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium leading-tight">{t('currencyForm.isActive')}</p>
                <p className="text-xs text-muted-foreground">
                  {isActive
                    ? t('currency.activeDescription') || 'Visible and usable'
                    : t('currency.inactiveDescription') || 'Hidden from users'}
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => setValue('is_active', checked, { shouldValidate: true })}
              />
            </div>

          </form>
        )}

        {/* Footer */}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending} className="min-w-[80px]">
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="currency-form" disabled={isPending || (isEditing && isDetailLoading)} className="min-w-[100px]">
            {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {isPending
              ? (isEditing ? t('common.updating') : t('common.creating'))
              : (isEditing ? t('common.update') : t('common.create'))}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
