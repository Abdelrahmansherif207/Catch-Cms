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
  bannerFormSchema,
  bannerFormDefaults,
  toApiFormat,
  type BannerFormValues,
} from '../schemas/banner.schema';
import {
  useCreateBanner,
  useUpdateBanner,
  useBanner,
  useProductSearch,
} from '../hooks/use-banners';
import type { Banner } from '../types/banner.types';
import type { ApiErrorResponse } from '@/shared/api';

interface BannerFormDialogProps {
  banner?: Banner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BannerFormDialog({
  banner,
  open,
  onOpenChange,
  onSuccess,
}: BannerFormDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!banner;
  const createMutation = useCreateBanner();
  const updateMutation = useUpdateBanner();
  const { data: bannerDetail, isLoading: isDetailLoading } = useBanner(banner?.id ?? 0);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [productNames, setProductNames] = useState<Record<number, string>>({});
  const { data: productsData, isLoading: isSearchingProducts } = useProductSearch(productSearch);

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: bannerFormDefaults,
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
      setProductNames({});
      form.reset(bannerFormDefaults);
    }
    prevOpenRef.current = open;
  }, [open, form]);

  useEffect(() => {
    if (isEditing && banner && bannerDetail?.data) {
      const d = bannerDetail.data;
      let parsedTitle: Record<string, string> = {};
      try {
        parsedTitle = typeof d.title === 'string' ? JSON.parse(d.title) : d.title;
      } catch {
        parsedTitle = { en: d.title, ar: d.title };
      }
      let parsedDescription: Record<string, string> = {};
      try {
        parsedDescription = typeof d.description === 'string' ? JSON.parse(d.description) : d.description;
      } catch {
        parsedDescription = { en: d.description, ar: d.description };
      }
      form.setValue('titleEn', parsedTitle.en || '');
      form.setValue('titleAr', parsedTitle.ar || '');
      form.setValue('descriptionEn', parsedDescription.en || '');
      form.setValue('descriptionAr', parsedDescription.ar || '');
      form.setValue('status', d.status ? '1' : '0');
      setDesktopPreview(d.image?.desktop || null);
      setMobilePreview(d.image?.mobile || null);
      if (d.products && d.products.length > 0) {
        form.setValue('productIds', d.products.map((p) => p.id));
        setProductNames(
          d.products.reduce((acc, p) => ({ ...acc, [p.id]: p.name }), {})
        );
      }
    }
  }, [bannerDetail, isEditing, banner, form]);

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
    if (!current.includes(productId)) {
      const product = availableProducts.find((p) => p.id === productId);
      if (product) {
        setProductNames((prev) => ({ ...prev, [productId]: product.name }));
      }
    }
  };

  const removeProduct = (productId: number) => {
    const current = form.getValues('productIds') || [];
    form.setValue('productIds', current.filter((id) => id !== productId), { shouldValidate: true });
  };

  const onSubmit = (values: BannerFormValues) => {
    setServerErrors({});
    const apiData = toApiFormat(values, isEditing);

    const commonOptions = {
      onError: (error: unknown) => {
        const apiError = error as ApiErrorResponse;
        if (apiError?.status === 422 && apiError.errors) {
          setServerErrors(apiError.errors);
        }
      },
    };

    if (isEditing && banner) {
      updateMutation.mutate(
        { id: banner.id, data: { ...apiData, _method: 'PUT' } as never },
        { ...commonOptions, onSuccess }
      );
    } else {
      createMutation.mutate(apiData as never, { ...commonOptions, onSuccess });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isDetailLoading;
  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof BannerFormValues]?.message as string | undefined;
    const serverErr = serverErrors[field]?.[0]
      || serverErrors['title.en']?.[0]
      || serverErrors['title.ar']?.[0]
      || serverErrors['description.en']?.[0]
      || serverErrors['description.ar']?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('banners.editBanner') : t('banners.createBanner')}
          </DialogTitle>
          <DialogDescription>{t('banners.subtitle')}</DialogDescription>
        </DialogHeader>

        {isDetailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="titleEn" className="text-sm font-medium">{t('bannersForm.titleEn')} *</label>
              <Input id="titleEn" placeholder={t('bannersForm.titleEn')} {...form.register('titleEn')} />
              {getError('titleEn') && <p className="text-xs text-destructive">{getError('titleEn')}</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="titleAr" className="text-sm font-medium">{t('bannersForm.titleAr')} *</label>
              <Input id="titleAr" placeholder={t('bannersForm.titleAr')} dir="rtl" {...form.register('titleAr')} />
              {getError('titleAr') && <p className="text-xs text-destructive">{getError('titleAr')}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="descriptionEn" className="text-sm font-medium">{t('bannersForm.descriptionEn')} *</label>
              <Textarea id="descriptionEn" placeholder={t('bannersForm.descriptionEn')} {...form.register('descriptionEn')} />
              {getError('descriptionEn') && <p className="text-xs text-destructive">{getError('descriptionEn')}</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="descriptionAr" className="text-sm font-medium">{t('bannersForm.descriptionAr')} *</label>
              <Textarea id="descriptionAr" placeholder={t('bannersForm.descriptionAr')} dir="rtl" {...form.register('descriptionAr')} />
              {getError('descriptionAr') && <p className="text-xs text-destructive">{getError('descriptionAr')}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('bannersForm.status')} *</label>
            <Select
              value={form.watch('status')}
              onValueChange={(value) => value && form.setValue('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('bannersForm.status')}>
                  {form.watch('status') === '1'
                    ? t('bannersForm.active')
                    : t('bannersForm.inactive')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('bannersForm.active')}</SelectItem>
                <SelectItem value="0">{t('bannersForm.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('bannersForm.products')}</label>
            <div className="relative">
              <button
                type="button"
                className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-transparent px-2.5 py-1 text-sm"
                onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
              >
                <span className={selectedProductIds.length === 0 ? 'text-muted-foreground' : ''}>
                  {selectedProductIds.length === 0
                    ? t('bannersForm.selectProducts')
                    : selectedProductIds.length + ' ' + t('bannersForm.productsSelected')}
                </span>
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </button>
              {productsDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                  <div className="relative mb-1">
                    <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={t('bannersForm.searchProducts')}
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
                      <p className="px-2 py-1 text-xs text-muted-foreground">{t('bannersForm.typeToSearch')}</p>
                    )}
                    {availableProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent"
                        onClick={() => toggleProduct(product.id)}
                      >
                        <div
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded-sm border',
                            selectedProductIds.includes(product.id)
                              ? 'bg-primary border-primary'
                              : 'border-input'
                          )}
                        >
                          {selectedProductIds.includes(product.id) && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
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
                {selectedProductIds.map((id) => (
                  <span key={id} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs">
                    {productNames[id] || `#${id}`}
                    <button type="button" onClick={() => removeProduct(id)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="imageDesktop" className="text-sm font-medium">{t('bannersForm.desktopImage')} {!isEditing && '*'}</label>
              <Input id="imageDesktop" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'imageDesktop', setDesktopPreview)} />
              {desktopPreview && <ImagePreview src={desktopPreview} alt="Desktop preview" thumbnailClassName="h-16 rounded border object-cover mt-1" />}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="imageMobile" className="text-sm font-medium">{t('bannersForm.mobileImage')} {!isEditing && '*'}</label>
              <Input id="imageMobile" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'imageMobile', setMobilePreview)} />
              {mobilePreview && <ImagePreview src={mobilePreview} alt="Mobile preview" thumbnailClassName="h-16 rounded border object-cover mt-1" />}
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
                  ? (isEditing ? t('banners.updating') : t('banners.creating'))
                  : (isEditing ? t('bannersForm.updateBanner') : t('bannersForm.createBanner'))}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
