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
  brandFormSchema,
  brandFormDefaults,
  toApiFormat,
  type BrandFormValues,
} from '../schemas/brand.schema';
import { useCreateBrand, useUpdateBrand, useBrand, useProductSearch } from '../hooks/use-brands';
import type { Brand } from '../types/brand.types';


interface BrandFormDialogProps {
  brand?: Brand | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BrandFormDialog({
  brand,
  open,
  onOpenChange,
  onSuccess,
}: BrandFormDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!brand;
  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();
  const { data: brandDetail, isLoading: isDetailLoading } = useBrand(brand?.id ?? 0);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const { data: productsData, isLoading: isSearchingProducts } = useProductSearch(productSearch);

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema) as any,
    defaultValues: brandFormDefaults,
  });

  const selectedProductIds = form.watch('productIds') || [];
  const availableProducts = productsData?.data?.data || [];

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setServerErrors({});
      setDesktopPreview(null);
      setMobilePreview(null);
      setProductSearch('');
      form.reset(brandFormDefaults);
    }
    prevOpenRef.current = open;
  }, [open, form]);

  useEffect(() => {
    if (isEditing && brand && brandDetail?.data) {
      const d = brandDetail.data;
      let parsedName: Record<string, string> = {};
      try {
        parsedName = typeof d.name === 'string' ? JSON.parse(d.name) : d.name;
      } catch {
        parsedName = { en: d.name, ar: d.name };
      }
      form.setValue('nameEn', parsedName.en || '');
      form.setValue('nameAr', parsedName.ar || '');
      let parsedDetails: Record<string, string> = {};
      try {
        parsedDetails = typeof d.details === 'string' ? JSON.parse(d.details) : d.details || {};
      } catch {
        parsedDetails = { en: d.details || '', ar: d.details || '' };
      }
      form.setValue('detailsEn', parsedDetails.en || '');
      form.setValue('detailsAr', parsedDetails.ar || '');
      form.setValue('status', d.status ? '1' : '0');
      setDesktopPreview(d.image?.desktop || null);
      setMobilePreview(d.image?.mobile || null);
      if (d.products && d.products.length > 0) {
        form.setValue('productIds', d.products.map((p) => p.id));
      }
    }
  }, [brandDetail, isEditing, brand, form]);

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

  const onSubmit = (values: BrandFormValues) => {
    setServerErrors({});
    const apiData = toApiFormat(values);

    const commonOptions = {
      onError: (error: unknown) => {
        const apiError = error as { status?: number; errors?: Record<string, string[]> };
        if (apiError?.status === 422 && apiError.errors) {
          setServerErrors(apiError.errors);
        }
      },
    };

    if (isEditing && brand) {
      updateMutation.mutate(
        { id: brand.id, data: { ...apiData, _method: 'PUT' } },
        { ...commonOptions, onSuccess }
      );
    } else {
      createMutation.mutate(apiData, { ...commonOptions, onSuccess });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isDetailLoading;
  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = (errors as Record<string, { message?: string }>)[field]?.message;
    const serverErr = serverErrors[field]?.[0] || serverErrors['name.en']?.[0] || serverErrors['name.ar']?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('brands.editBrand') : t('brands.createBrand')}</DialogTitle>
          <DialogDescription>
            {t('brands.subtitle')}
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
              <label htmlFor="nameEn" className="text-sm font-medium">{t('brandsForm.nameEn')} *</label>
              <Input
                id="nameEn"
                placeholder={t('brandsForm.nameEn')}
                {...form.register('nameEn')}
              />
              {getError('nameEn') && (
                <p className="text-xs text-destructive">{getError('nameEn')}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="nameAr" className="text-sm font-medium">{t('brandsForm.nameAr')} *</label>
              <Input
                id="nameAr"
                placeholder={t('brandsForm.nameAr')}
                dir="rtl"
                {...form.register('nameAr')}
              />
              {getError('nameAr') && (
                <p className="text-xs text-destructive">{getError('nameAr')}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="detailsEn" className="text-sm font-medium">{t('brandsForm.detailsEn')}</label>
            <Textarea id="detailsEn" placeholder={t('brandsForm.detailsEn')} rows={2} {...form.register('detailsEn')} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="detailsAr" className="text-sm font-medium">{t('brandsForm.detailsAr')}</label>
            <Textarea id="detailsAr" placeholder={t('brandsForm.detailsAr')} dir="rtl" rows={2} {...form.register('detailsAr')} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('brandsForm.status')} *</label>
            <Select
              value={form.watch('status')}
              onValueChange={(value) => value && form.setValue('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('brandsForm.status')}>
                  {form.watch('status') === '1' ? t('brandsForm.active') : t('brandsForm.inactive')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('brandsForm.active')}</SelectItem>
                <SelectItem value="0">{t('brandsForm.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('brandsForm.products')}</label>
            <div className="relative">
              <button
                type="button"
                className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-transparent px-2.5 py-1 text-sm"
                onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
              >
                <span className={selectedProductIds.length === 0 ? 'text-muted-foreground' : ''}>
                  {selectedProductIds.length === 0
                    ? t('brandsForm.selectProducts')
                    : selectedProductIds.length + ' ' + t('brandsForm.productsSelected') }
                </span>
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </button>
              {productsDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                  <div className="relative mb-1">
                    <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={t('brandsForm.searchProducts')}
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
                      <p className="px-2 py-1 text-xs text-muted-foreground">{t('brandsForm.typeToSearch')}</p>
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
              <label htmlFor="imageDesktop" className="text-sm font-medium">{t('brandsForm.desktopImage')}</label>
              <Input id="imageDesktop" type="file" accept=".jpeg,.png,.jpg,.gif,.svg" onChange={(e) => handleFileChange(e, 'imageDesktop', setDesktopPreview)} />
              {desktopPreview && <ImagePreview src={desktopPreview} alt="Desktop preview" thumbnailClassName="h-16 rounded border object-cover mt-1" />}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="imageMobile" className="text-sm font-medium">{t('brandsForm.mobileImage')}</label>
              <Input id="imageMobile" type="file" accept=".jpeg,.png,.jpg,.gif,.svg" onChange={(e) => handleFileChange(e, 'imageMobile', setMobilePreview)} />
              {mobilePreview && <ImagePreview src={mobilePreview} alt="Mobile preview" thumbnailClassName="h-16 rounded border object-cover mt-1" />}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isPending || isDetailLoading}>
              {isDetailLoading
                ? t('common.loading')
                : isPending
                  ? (isEditing ? t('brands.updating') : t('brands.creating'))
                  : (isEditing ? t('brandsForm.updateBrand') : t('brandsForm.createBrand'))}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
