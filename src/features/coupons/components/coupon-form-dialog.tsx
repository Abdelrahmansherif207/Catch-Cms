import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { ImagePreview } from '@/shared/components/image-preview';
import {
  couponFormSchema,
  couponFormDefaults,
  toCreateApiFormat,
  toUpdateApiFormat,
  type CouponFormValues,
} from '../schemas/coupon.schema';
import { useCreateCoupon, useUpdateCoupon, useCoupon } from '../hooks/use-coupons';
import type { Coupon } from '../types/coupon.types';
import type { ApiErrorResponse } from '@/shared/api';

interface CouponFormDialogProps {
  coupon?: Coupon | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CouponFormDialog({
  coupon,
  open,
  onOpenChange,
  onSuccess,
}: CouponFormDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!coupon;
  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon();
  const { data: couponDetail, isLoading: isDetailLoading } = useCoupon(coupon?.id ?? 0);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema) as any,
    defaultValues: couponFormDefaults,
  });

  const selectedDiscountType = form.watch('discountType');

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setServerErrors({});
      setDesktopPreview(null);
      setMobilePreview(null);
      form.reset(couponFormDefaults);
    }
    prevOpenRef.current = open;
  }, [open, form]);

  useEffect(() => {
    if (isEditing && coupon && couponDetail?.data) {
      const d = couponDetail.data;
      let parsedName: Record<string, string> = {};
      try {
        parsedName = typeof d.name === 'string' ? JSON.parse(d.name) : d.name;
      } catch {
        parsedName = { en: d.name, ar: d.name };
      }
      form.setValue('nameEn', parsedName.en || '');
      form.setValue('nameAr', parsedName.ar || '');
      form.setValue('discount', Number(d.discount) || 0);
      form.setValue('startDate', d.start_date ? d.start_date.split('T')[0] : '');
      form.setValue('endDate', d.end_date ? d.end_date.split('T')[0] : '');
      form.setValue('status', d.status ? '1' : '0');
      const typeMap: Record<string, string> = {
        'Percentage discount': 'percentage',
        'Fixed discount': 'fixed_rate',
      };
      form.setValue('discountType', typeMap[d.discount_type] || d.discount_type || 'percentage');
      if (d.max_discount_amount) {
        form.setValue('maxDiscountAmount', Number(d.max_discount_amount));
      }
      if (d.limiter !== null && d.limiter !== undefined) {
        form.setValue('limiter', d.limiter);
      }
      if (d.borderColor) {
        form.setValue('borderColor', d.borderColor);
      }
      if (d.borderless) {
        form.setValue('borderless', '1');
      }
      setDesktopPreview(d.image?.desktop || null);
      setMobilePreview(d.image?.mobile || null);
    }
  }, [couponDetail, isEditing, coupon, form]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'imageDesktop' | 'imageMobile',
    setPreview: (preview: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    form.setValue(field, file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const onSubmit = (values: CouponFormValues) => {
    setServerErrors({});

    const commonOptions = {
      onError: (error: unknown) => {
        const apiError = error as ApiErrorResponse;
        if (apiError?.status === 422 && apiError.errors) {
          setServerErrors(apiError.errors);
        }
      },
    };

    if (isEditing && coupon) {
      const apiData = toUpdateApiFormat(values);
      updateMutation.mutate(
        { id: coupon.id, data: apiData },
        { ...commonOptions, onSuccess }
      );
    } else {
      if (!values.imageDesktop || !values.imageMobile) {
        return;
      }
      const apiData = toCreateApiFormat(values);
      createMutation.mutate(apiData, { ...commonOptions, onSuccess });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isDetailLoading;
  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof CouponFormValues]?.message as string | undefined;
    const serverErr = serverErrors[field]?.[0]
      || serverErrors['name.en']?.[0]
      || serverErrors['name.ar']?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('coupons.editCoupon') : t('coupons.createCoupon')}</DialogTitle>
          <DialogDescription>
            {t('coupons.subtitle')}
          </DialogDescription>
        </DialogHeader>

        {isDetailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="nameEn" className="text-sm font-medium">{t('couponsForm.nameEn')} *</label>
              <Input id="nameEn" placeholder={t('couponsForm.nameEn')} {...form.register('nameEn')} />
              {getError('nameEn') && (
                <p className="text-xs text-destructive">{getError('nameEn')}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="nameAr" className="text-sm font-medium">{t('couponsForm.nameAr')} *</label>
              <Input id="nameAr" placeholder={t('couponsForm.nameAr')} dir="rtl" {...form.register('nameAr')} />
              {getError('nameAr') && (
                <p className="text-xs text-destructive">{getError('nameAr')}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="startDate" className="text-sm font-medium">{t('couponsForm.startDate')} *</label>
              <Input id="startDate" type="date" {...form.register('startDate')} />
              {getError('startDate') && (
                <p className="text-xs text-destructive">{getError('startDate')}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="endDate" className="text-sm font-medium">{t('couponsForm.endDate')} *</label>
              <Input id="endDate" type="date" {...form.register('endDate')} />
              {getError('endDate') && (
                <p className="text-xs text-destructive">{getError('endDate')}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {selectedDiscountType !== 'free_shipping' && (
            <div className="space-y-1.5">
              <label htmlFor="discount" className="text-sm font-medium">{t('couponsForm.discount')} *</label>
              <Input id="discount" type="number" step="0.01" min="0" {...form.register('discount')} />
              {getError('discount') && (
                <p className="text-xs text-destructive">{getError('discount')}</p>
              )}
            </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('couponsForm.discountType')} *</label>
              <Select
                value={form.watch('discountType')}
                onValueChange={(value) => { if (value) form.setValue('discountType', value); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('couponsForm.discountType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">{t('couponsForm.percentage')}</SelectItem>
                  <SelectItem value="fixed_rate">{t('couponsForm.fixedRate')}</SelectItem>
                  <SelectItem value="free_shipping">{t('couponsForm.freeShipping')}</SelectItem>
                </SelectContent>
              </Select>
              {getError('discountType') && (
                <p className="text-xs text-destructive">{getError('discountType')}</p>
              )}
            </div>
          </div>

          {selectedDiscountType === 'percentage' && (
            <div className="space-y-1.5">
              <label htmlFor="maxDiscountAmount" className="text-sm font-medium">{t('couponsForm.maxDiscountAmount')}</label>
              <Input id="maxDiscountAmount" type="number" step="0.01" min="1" {...form.register('maxDiscountAmount')} />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="limiter" className="text-sm font-medium">{t('couponsForm.limiter')}</label>
              <Input id="limiter" type="number" min="0" {...form.register('limiter')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('couponsForm.status')} *</label>
              <Select
                value={form.watch('status')}
                onValueChange={(value) => { if (value) form.setValue('status', value); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('couponsForm.status')}>
                    {form.watch('status') === '1' ? t('couponsForm.active') : t('couponsForm.inactive')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('couponsForm.active')}</SelectItem>
                  <SelectItem value="0">{t('couponsForm.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="borderColor" className="text-sm font-medium">{t('couponsForm.borderColor')}</label>
              <Input id="borderColor" type="text" placeholder="#ff0000" {...form.register('borderColor')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('couponsForm.borderless')}</label>
              <Select
                value={form.watch('borderless') || '0'}
                onValueChange={(value) => { if (value) form.setValue('borderless', value); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t('common.no')}</SelectItem>
                  <SelectItem value="1">{t('common.yes')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="imageDesktop" className="text-sm font-medium">{t('couponsForm.desktopImage')} {!isEditing && '*'}</label>
              <Input id="imageDesktop" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'imageDesktop', setDesktopPreview)} />
              {desktopPreview && <ImagePreview src={desktopPreview} alt="Desktop preview" thumbnailClassName="h-16 rounded border object-cover mt-1" />}
              {getError('imageDesktop') && (
                <p className="text-xs text-destructive">{getError('imageDesktop')}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="imageMobile" className="text-sm font-medium">{t('couponsForm.mobileImage')} {!isEditing && '*'}</label>
              <Input id="imageMobile" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'imageMobile', setMobilePreview)} />
              {mobilePreview && <ImagePreview src={mobilePreview} alt="Mobile preview" thumbnailClassName="h-16 rounded border object-cover mt-1" />}
              {getError('imageMobile') && (
                <p className="text-xs text-destructive">{getError('imageMobile')}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isDetailLoading
                ? t('common.loading')
                : isPending
                  ? (isEditing ? t('coupons.updating') : t('coupons.creating'))
                  : (isEditing ? t('couponsForm.updateCoupon') : t('couponsForm.createCoupon'))}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CouponFormContent({
  coupon,
  onSuccess,
  onCancel,
}: {
  coupon?: Coupon | null;
  onSuccess: () => void;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const isEditing = !!coupon;
  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon();
  const { data: couponDetail, isLoading: isDetailLoading } = useCoupon(coupon?.id ?? 0);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema) as any,
    defaultValues: couponFormDefaults,
  });

  const selectedDiscountType = form.watch('discountType');

  useEffect(() => {
    if (isEditing && coupon && couponDetail?.data) {
      const d = couponDetail.data;
      let parsedName: Record<string, string> = {};
      try {
        parsedName = typeof d.name === 'string' ? JSON.parse(d.name) : d.name;
      } catch {
        parsedName = { en: d.name, ar: d.name };
      }
      form.setValue('nameEn', parsedName.en || '');
      form.setValue('nameAr', parsedName.ar || '');
      form.setValue('discount', Number(d.discount) || 0);
      form.setValue('startDate', d.start_date ? d.start_date.split('T')[0] : '');
      form.setValue('endDate', d.end_date ? d.end_date.split('T')[0] : '');
      form.setValue('status', d.status ? '1' : '0');
      const typeMap: Record<string, string> = {
        'Percentage discount': 'percentage',
        'Fixed discount': 'fixed_rate',
      };
      form.setValue('discountType', typeMap[d.discount_type] || d.discount_type || 'percentage');
      if (d.max_discount_amount) {
        form.setValue('maxDiscountAmount', Number(d.max_discount_amount));
      }
      if (d.limiter !== null && d.limiter !== undefined) {
        form.setValue('limiter', d.limiter);
      }
      if (d.borderColor) {
        form.setValue('borderColor', d.borderColor);
      }
      if (d.borderless) {
        form.setValue('borderless', '1');
      }
      setDesktopPreview(d.image?.desktop || null);
      setMobilePreview(d.image?.mobile || null);
    }
  }, [couponDetail, isEditing, coupon, form]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'imageDesktop' | 'imageMobile',
    setPreview: (preview: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    form.setValue(field, file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const onSubmit = (values: CouponFormValues) => {
    setServerErrors({});

    const commonOptions = {
      onError: (error: unknown) => {
        const apiError = error as ApiErrorResponse;
        if (apiError?.status === 422 && apiError.errors) {
          setServerErrors(apiError.errors);
        }
      },
    };

    if (isEditing && coupon) {
      const apiData = toUpdateApiFormat(values);
      updateMutation.mutate(
        { id: coupon.id, data: apiData },
        { ...commonOptions, onSuccess }
      );
    } else {
      if (!values.imageDesktop || !values.imageMobile) {
        return;
      }
      const apiData = toCreateApiFormat(values);
      createMutation.mutate(apiData, { ...commonOptions, onSuccess });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isDetailLoading;
  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof CouponFormValues]?.message as string | undefined;
    const serverErr = serverErrors[field]?.[0]
      || serverErrors['name.en']?.[0]
      || serverErrors['name.ar']?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  if (isDetailLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="nameEn" className="text-sm font-medium">{t('couponsForm.nameEn')} *</label>
          <Input id="nameEn" placeholder={t('couponsForm.nameEn')} {...form.register('nameEn')} />
          {getError('nameEn') && (
            <p className="text-xs text-destructive">{getError('nameEn')}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="nameAr" className="text-sm font-medium">{t('couponsForm.nameAr')} *</label>
          <Input id="nameAr" placeholder={t('couponsForm.nameAr')} dir="rtl" {...form.register('nameAr')} />
          {getError('nameAr') && (
            <p className="text-xs text-destructive">{getError('nameAr')}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="startDate" className="text-sm font-medium">{t('couponsForm.startDate')} *</label>
          <Input id="startDate" type="date" {...form.register('startDate')} />
          {getError('startDate') && (
            <p className="text-xs text-destructive">{getError('startDate')}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="endDate" className="text-sm font-medium">{t('couponsForm.endDate')} *</label>
          <Input id="endDate" type="date" {...form.register('endDate')} />
          {getError('endDate') && (
            <p className="text-xs text-destructive">{getError('endDate')}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {selectedDiscountType !== 'free_shipping' && (
        <div className="space-y-1.5">
          <label htmlFor="discount" className="text-sm font-medium">{t('couponsForm.discount')} *</label>
          <Input id="discount" type="number" step="0.01" min="0" {...form.register('discount')} />
          {getError('discount') && (
            <p className="text-xs text-destructive">{getError('discount')}</p>
          )}
        </div>
        )}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t('couponsForm.discountType')} *</label>
          <Select
            value={form.watch('discountType')}
            onValueChange={(value) => { if (value) form.setValue('discountType', value); }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('couponsForm.discountType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">{t('couponsForm.percentage')}</SelectItem>
              <SelectItem value="fixed_rate">{t('couponsForm.fixedRate')}</SelectItem>
              <SelectItem value="free_shipping">{t('couponsForm.freeShipping')}</SelectItem>
            </SelectContent>
          </Select>
          {getError('discountType') && (
            <p className="text-xs text-destructive">{getError('discountType')}</p>
          )}
        </div>
      </div>

      {selectedDiscountType === 'percentage' && (
        <div className="space-y-1.5">
          <label htmlFor="maxDiscountAmount" className="text-sm font-medium">{t('couponsForm.maxDiscountAmount')}</label>
          <Input id="maxDiscountAmount" type="number" step="0.01" min="1" {...form.register('maxDiscountAmount')} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="limiter" className="text-sm font-medium">{t('couponsForm.limiter')}</label>
          <Input id="limiter" type="number" min="0" {...form.register('limiter')} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t('couponsForm.status')} *</label>
          <Select
            value={form.watch('status')}
            onValueChange={(value) => { if (value) form.setValue('status', value); }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('couponsForm.status')}>
                {form.watch('status') === '1' ? t('couponsForm.active') : t('couponsForm.inactive')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{t('couponsForm.active')}</SelectItem>
              <SelectItem value="0">{t('couponsForm.inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="borderColor" className="text-sm font-medium">{t('couponsForm.borderColor')}</label>
          <Input id="borderColor" type="text" placeholder="#ff0000" {...form.register('borderColor')} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t('couponsForm.borderless')}</label>
          <Select
            value={form.watch('borderless') || '0'}
            onValueChange={(value) => { if (value) form.setValue('borderless', value); }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">{t('common.no')}</SelectItem>
              <SelectItem value="1">{t('common.yes')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="imageDesktop" className="text-sm font-medium">{t('couponsForm.desktopImage')} {!isEditing && '*'}</label>
          <Input id="imageDesktop" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'imageDesktop', setDesktopPreview)} />
          {desktopPreview && <ImagePreview src={desktopPreview} alt="Desktop preview" thumbnailClassName="h-16 rounded border object-cover mt-1" />}
          {getError('imageDesktop') && (
            <p className="text-xs text-destructive">{getError('imageDesktop')}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="imageMobile" className="text-sm font-medium">{t('couponsForm.mobileImage')} {!isEditing && '*'}</label>
          <Input id="imageMobile" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'imageMobile', setMobilePreview)} />
          {mobilePreview && <ImagePreview src={mobilePreview} alt="Mobile preview" thumbnailClassName="h-16 rounded border object-cover mt-1" />}
          {getError('imageMobile') && (
            <p className="text-xs text-destructive">{getError('imageMobile')}</p>
          )}
        </div>
      </div>

      <DialogFooter>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            {t('common.cancel')}
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isDetailLoading
            ? t('common.loading')
            : isPending
              ? (isEditing ? t('coupons.updating') : t('coupons.creating'))
              : (isEditing ? t('couponsForm.updateCoupon') : t('couponsForm.createCoupon'))}
        </Button>
      </DialogFooter>
    </form>
  );
}
