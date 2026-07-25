import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { ImagePreview } from '@/shared/components/image-preview';
import { cn } from '@/shared/lib/utils';
import {
  flashSaleFormSchema,
  flashSaleFormDefaults,
  toApiFormat,
  type FlashSaleFormValues,
} from '../schemas/flash-sale.schema';
import { useCreateFlashSale, useUpdateFlashSale, useFlashSale, useProductSearch } from '../hooks/use-flash-sale';
import type { FlashSale } from '../types/flash-sale.types';
import type { ApiErrorResponse } from '@/shared/api';

interface FlashSaleFormDialogProps {
  flashSale?: FlashSale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function FlashSaleFormDialog({
  flashSale,
  open,
  onOpenChange,
  onSuccess,
}: FlashSaleFormDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!flashSale;
  const createMutation = useCreateFlashSale();
  const updateMutation = useUpdateFlashSale();
  const { data: flashSaleDetail, isLoading: isDetailLoading } = useFlashSale(flashSale?.id ?? 0);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const { data: productsData, isLoading: isSearchingProducts } = useProductSearch(productSearch);

  const form = useForm<FlashSaleFormValues>({
    resolver: zodResolver(flashSaleFormSchema) as any,
    defaultValues: flashSaleFormDefaults,
  });

  const selectedProductIds = form.watch('productIds') || [];
  const selectedType = form.watch('type');
  const availableProducts = productsData?.data?.data || [];

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setServerErrors({});
      setDesktopPreview(null);
      setMobilePreview(null);
      setProductSearch('');
      form.reset(flashSaleFormDefaults);
    }
    prevOpenRef.current = open;
  }, [open, form]);

  useEffect(() => {
    if (isEditing && flashSale && flashSaleDetail?.data) {
      const d = flashSaleDetail.data;
      let parsedTitle: Record<string, string> = {};
      try {
        parsedTitle = typeof d.title === 'string' ? JSON.parse(d.title) : d.title;
      } catch {
        parsedTitle = { en: d.title, ar: d.title };
      }
      form.setValue('titleEn', parsedTitle.en || '');
      form.setValue('titleAr', parsedTitle.ar || '');
      form.setValue('descriptionEn', d.description || '');
      form.setValue('descriptionAr', d.description || '');
      form.setValue('startDate', d.start_date ? d.start_date.split('T')[0] : '');
      form.setValue('endDate', d.end_date ? d.end_date.split('T')[0] : '');
      form.setValue('status', d.status ? '1' : '0');
      form.setValue('discount', Number(d.discount) || 0);
      const typeMap: Record<string, string> = {
        'Percentage discount': 'percentage',
        'Fixed discount': 'fixed_rate',
      };
      const rawType = typeMap[d.type] || d.type || 'percentage';
      form.setValue('type', rawType);
      if (d.max_discount_amount) {
        form.setValue('maxDiscountAmount', Number(d.max_discount_amount));
      }
      setDesktopPreview(d.image?.desktop || null);
      setMobilePreview(d.image?.mobile || null);
      if (d.products && d.products.length > 0) {
        form.setValue('productIds', d.products.map((p) => p.id));
      }
    }
  }, [flashSaleDetail, isEditing, flashSale, form]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'imageDesktop' | 'imageMobile',
    setPreview: (preview: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    form.setValue(field, file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string | null);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const toggleProduct = (productId: number) => {
    const current = form.getValues('productIds') || [];
    const updated = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    form.setValue('productIds', updated, { shouldValidate: true });
  };

  const removeProduct = (productId: number) => {
    const current = form.getValues('productIds') || [];
    form.setValue('productIds', current.filter((id) => id !== productId), { shouldValidate: true });
  };

  const selectedProductNames = availableProducts
    .filter((p) => selectedProductIds.includes(p.id))
    .map((p) => p.name);

  const onSubmit = (values: FlashSaleFormValues) => {
    setServerErrors({});
    const apiData = toApiFormat(values);

    const commonOptions = {
      onError: (error: unknown) => {
        const apiError = error as ApiErrorResponse;
        if (apiError?.status === 422 && apiError.errors) {
          setServerErrors(apiError.errors);
        }
      },
    };

    if (isEditing && flashSale) {
      updateMutation.mutate(
        { id: flashSale.id, data: { ...apiData, _method: 'PUT' as const } },
        { ...commonOptions, onSuccess }
      );
    } else {
      createMutation.mutate(apiData, { ...commonOptions, onSuccess });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isDetailLoading;
  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof FlashSaleFormValues]?.message as string | undefined;
    const serverErr = serverErrors[field]?.[0] || serverErrors['title.en']?.[0] || serverErrors['title.ar']?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('flashSale.edit') : t('flashSale.create')}</DialogTitle>
          <DialogDescription>
            {t('flashSale.subtitle')}
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
              <label htmlFor="titleEn" className="text-sm font-medium">{t('flashSaleForm.titleEn')} *</label>
              <Input
                id="titleEn"
                placeholder={t('flashSaleForm.titleEn')}
                {...form.register('titleEn')}
              />
              {getError('titleEn') && (
                <p className="text-xs text-destructive">{getError('titleEn')}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="titleAr" className="text-sm font-medium">{t('flashSaleForm.titleAr')} *</label>
              <Input
                id="titleAr"
                placeholder={t('flashSaleForm.titleAr')}
                dir="rtl"
                {...form.register('titleAr')}
              />
              {getError('titleAr') && (
                <p className="text-xs text-destructive">{getError('titleAr')}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="descriptionEn" className="text-sm font-medium">{t('flashSaleForm.descriptionEn')}</label>
              <Textarea id="descriptionEn" placeholder={t('flashSaleForm.descriptionEn')} rows={2} {...form.register('descriptionEn')} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="descriptionAr" className="text-sm font-medium">{t('flashSaleForm.descriptionAr')}</label>
              <Textarea id="descriptionAr" placeholder={t('flashSaleForm.descriptionAr')} dir="rtl" rows={2} {...form.register('descriptionAr')} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="startDate" className="text-sm font-medium">{t('flashSaleForm.startDate')} *</label>
              <Input id="startDate" type="date" {...form.register('startDate')} />
              {getError('startDate') && (
                <p className="text-xs text-destructive">{getError('startDate')}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="endDate" className="text-sm font-medium">{t('flashSaleForm.endDate')} *</label>
              <Input id="endDate" type="date" {...form.register('endDate')} />
              {getError('endDate') && (
                <p className="text-xs text-destructive">{getError('endDate')}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('flashSaleForm.type')} *</label>
              <Select
                value={form.watch('type')}
                onValueChange={(value) => value && form.setValue('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('flashSaleForm.type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">{t('flashSaleForm.percentage')}</SelectItem>
                  <SelectItem value="fixed_rate">{t('flashSaleForm.fixedRate')}</SelectItem>
                  <SelectItem value="final_price">{t('flashSaleForm.finalPrice')}</SelectItem>
                </SelectContent>
              </Select>
              {getError('type') && (
                <p className="text-xs text-destructive">{getError('type')}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="discount" className="text-sm font-medium">{t('flashSaleForm.discount')} *</label>
              <Input id="discount" type="number" step="0.01" min="0" {...form.register('discount')} />
              {getError('discount') && (
                <p className="text-xs text-destructive">{getError('discount')}</p>
              )}
            </div>
          </div>

          {selectedType === 'percentage' && (
            <div className="space-y-1.5">
              <label htmlFor="maxDiscountAmount" className="text-sm font-medium">{t('flashSaleForm.maxDiscountAmount')}</label>
              <Input id="maxDiscountAmount" type="number" step="0.01" min="1" placeholder={t('flashSaleForm.maxDiscountHint')} {...form.register('maxDiscountAmount')} />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('flashSaleForm.status')} *</label>
            <Select
              value={form.watch('status')}
              onValueChange={(value) => value && form.setValue('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('flashSaleForm.status')}>
                  {form.watch('status') === '1' ? t('flashSaleForm.active') : t('flashSaleForm.inactive')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('flashSaleForm.active')}</SelectItem>
                <SelectItem value="0">{t('flashSaleForm.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('flashSaleForm.products')}</label>
            <div className="relative">
              <button
                type="button"
                className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-transparent px-2.5 py-1 text-sm"
                onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
              >
                <span className={selectedProductIds.length === 0 ? 'text-muted-foreground' : ''}>
                  {selectedProductIds.length === 0
                    ? t('flashSaleForm.selectProducts')
                    : selectedProductIds.length + ' ' + t('flashSaleForm.productsSelected') }
                </span>
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </button>
              {productsDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                  <div className="relative mb-1">
                    <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={t('flashSaleForm.searchProducts')}
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="h-7 ps-7 text-xs"
                    />
                  </div>
                  <div className="max-h-[150px] overflow-auto">
                    {isSearchingProducts && productSearch.length > 0 && (
                      <p className="px-2 py-1 text-xs text-muted-foreground">{t('common.loading')}</p>
                    )}
                    {!isSearchingProducts && availableProducts.length === 0 && productSearch.length > 0 && (
                      <p className="px-2 py-1 text-xs text-muted-foreground">{t('common.noData')}</p>
                    )}
                    {!isSearchingProducts && availableProducts.length === 0 && productSearch.length === 0 && (
                      <p className="px-2 py-1 text-xs text-muted-foreground">{t('flashSaleForm.typeToSearch')}</p>
                    )}
                    {availableProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent"
                        onClick={() => toggleProduct(product.id)}
                      >
                        <div className={cn(
                          'flex h-4 w-4 items-center justify-center rounded-sm border',
                          selectedProductIds.includes(product.id) ? 'bg-primary border-primary' : 'border-input'
                        )}>
                          {selectedProductIds.includes(product.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className="text-sm">{product.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {selectedProductIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedProductNames.map((name, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs">
                    {name}
                    <button type="button" onClick={() => removeProduct(selectedProductIds[i])}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="imageDesktop" className="text-sm font-medium">{t('flashSaleForm.desktopImage')}</label>
              <Input id="imageDesktop" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'imageDesktop', setDesktopPreview)} />
              {desktopPreview && <ImagePreview src={desktopPreview} alt="Desktop preview" thumbnailClassName="h-16 rounded border object-cover mt-1" />}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="imageMobile" className="text-sm font-medium">{t('flashSaleForm.mobileImage')}</label>
              <Input id="imageMobile" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'imageMobile', setMobilePreview)} />
              {mobilePreview && <ImagePreview src={mobilePreview} alt="Mobile preview" thumbnailClassName="h-16 rounded border object-cover mt-1" />}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isPending || isDetailLoading}>
              {isDetailLoading
                ? t('common.loading')
                : isPending
                  ? (isEditing ? t('flashSale.updating') : t('flashSale.creating'))
                  : (isEditing ? t('flashSaleForm.updateFlashSale') : t('flashSaleForm.createFlashSale'))}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
