import { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
  promotionFormSchema,
  promotionFormDefaults,
  toApiFormat,
  type PromotionFormValues,
} from '../schemas/promotion.schema';
import {
  useCreatePromotion,
  useUpdatePromotion,
  usePromotion,
  useProductSearch,
} from '../hooks/use-promotions';
import type { Promotion } from '../types/promotion.types';
import type { ApiErrorResponse } from '@/shared/api';

interface PromotionFormDialogProps {
  promotion?: Promotion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PromotionFormDialog({
  promotion,
  open,
  onOpenChange,
  onSuccess,
}: PromotionFormDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!promotion;
  const createMutation = useCreatePromotion();
  const updateMutation = useUpdatePromotion();
  const { data: promotionDetail, isLoading: isDetailLoading } = usePromotion(
    promotion?.id ?? 0
  );
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const { data: productsData, isLoading: isSearchingProducts } =
    useProductSearch(productSearch);
  const [giftSearch, setGiftSearch] = useState('');
  const [giftDropdownOpen, setGiftDropdownOpen] = useState<number>(-1);
  const { data: giftProductsData, isLoading: isSearchingGiftProducts } =
    useProductSearch(giftSearch);
  const [giftProductNames, setGiftProductNames] = useState<Record<number, string>>({});

  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: promotionFormDefaults,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'giftProducts',
  } as never);

  const selectedProductIds = form.watch('productIds') || [];
  const watchType = form.watch('type');
  const watchTypeAmount = form.watch('typeAmount');
  const watchApplyTo = form.watch('applyTo');
  const availableProducts = productsData?.data?.data || [];

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setServerErrors({});
      setDesktopPreview(null);
      setMobilePreview(null);
      setProductSearch('');
      setGiftSearch('');
      setGiftDropdownOpen(-1);
      setGiftProductNames({});
      form.reset(promotionFormDefaults);
    }
    prevOpenRef.current = open;
  }, [open, form]);

  useEffect(() => {
    if (isEditing && promotion && promotionDetail?.data) {
      const d = promotionDetail.data;
      let parsedName: { en?: string; ar?: string } = {};
      try {
        parsedName =
          typeof d.name === 'string'
            ? JSON.parse(d.name)
            : (d.name as unknown as { en?: string; ar?: string });
      } catch {
        parsedName = { en: d.name, ar: d.name };
      }

      form.setValue('nameEn', parsedName.en || d.name || '');
      form.setValue('nameAr', parsedName.ar || d.name || '');
      form.setValue('type', d.type?.toLowerCase().includes('quantity') ? 'quantity' : 'price');
      form.setValue(
        'typeAmount',
        (d.discount_type as 'fixed_rate' | 'percentage' | 'gift') || 'fixed_rate'
      );
      form.setValue('discount', String(d.discount));
      form.setValue('minimumOrderAmount', String(d.minimum_order_amount));
      form.setValue('requiredQuantity', String(d.required_quantity));
      form.setValue('applyTo', (d.apply_to as 'all_products' | 'specific_products') || 'all_products');
      form.setValue('startAt', d.start_at ? d.start_at.split('T')[0] : '');
      form.setValue('endAt', d.end_at ? d.end_at.split('T')[0] : '');
      form.setValue('status', d.status ? '1' : '0');
      setDesktopPreview(d.image?.desktop || null);
      setMobilePreview(d.image?.mobile || null);
    }
  }, [promotionDetail, isEditing, promotion, form]);

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
    form.setValue('productIds', current.filter((id) => id !== productId), {
      shouldValidate: true,
    });
  };

  const selectedProductNames = availableProducts
    .filter((p) => selectedProductIds.includes(p.id))
    .map((p) => p.name);

  const onSubmit = (values: PromotionFormValues) => {
    setServerErrors({});
    const apiData = toApiFormat(values, isEditing);

    const commonOptions = {
      onError: (error: unknown) => {
        const apiError = error as ApiErrorResponse;
        if ((apiError as { status?: number })?.status === 422 && (apiError as { errors?: Record<string, string[]> })?.errors) {
          setServerErrors((apiError as { errors: Record<string, string[]> }).errors);
        }
      },
    };

    if (isEditing && promotion) {
      updateMutation.mutate(
        { id: promotion.id, data: { ...apiData, _method: 'PUT' } as never },
        { ...commonOptions, onSuccess }
      );
    } else {
      createMutation.mutate(apiData as never, { ...commonOptions, onSuccess });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isDetailLoading;
  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = (errors as Record<string, { message?: string }>)[field]?.message;
    const serverErr = serverErrors[field]?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t('promotions.editPromotion')
              : t('promotions.createPromotion')}
          </DialogTitle>
          <DialogDescription>{t('promotions.subtitle')}</DialogDescription>
        </DialogHeader>

        {isDetailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="nameEn" className="text-sm font-medium">
                {t('promotionsForm.nameEn')} *
              </label>
              <Input
                id="nameEn"
                placeholder={t('promotionsForm.nameEn')}
                {...form.register('nameEn')}
              />
              {getError('nameEn') && (
                <p className="text-xs text-destructive">{getError('nameEn')}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="nameAr" className="text-sm font-medium">
                {t('promotionsForm.nameAr')} *
              </label>
              <Input
                id="nameAr"
                placeholder={t('promotionsForm.nameAr')}
                dir="rtl"
                {...form.register('nameAr')}
              />
              {getError('nameAr') && (
                <p className="text-xs text-destructive">{getError('nameAr')}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t('promotionsForm.type')} *
              </label>
              <Select
                value={form.watch('type')}
                onValueChange={(value) => value && form.setValue('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('promotionsForm.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">{t('promotionsForm.priceDiscount')}</SelectItem>
                  <SelectItem value="quantity">{t('promotionsForm.quantityPromotion')}</SelectItem>
                </SelectContent>
              </Select>
              {getError('type') && (
                <p className="text-xs text-destructive">{getError('type')}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t('promotionsForm.typeAmount')} *
              </label>
              <Select
                value={form.watch('typeAmount')}
                onValueChange={(value) => value && form.setValue('typeAmount', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('promotionsForm.selectTypeAmount')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed_rate">{t('promotionsForm.fixedRate')}</SelectItem>
                  <SelectItem value="percentage">{t('promotionsForm.percentage')}</SelectItem>
                  <SelectItem value="gift">{t('promotionsForm.gift')}</SelectItem>
                </SelectContent>
              </Select>
              {getError('typeAmount') && (
                <p className="text-xs text-destructive">{getError('typeAmount')}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="discount" className="text-sm font-medium">
              {t('promotionsForm.discount')} *
            </label>
            <Input
              id="discount"
              type="number"
              placeholder={t('promotionsForm.discount')}
              {...form.register('discount')}
            />
            {getError('discount') && (
              <p className="text-xs text-destructive">{getError('discount')}</p>
            )}
          </div>

          {watchTypeAmount === 'percentage' && (
            <div className="space-y-1.5">
              <label htmlFor="maxDiscountAmount" className="text-sm font-medium">
                {t('promotionsForm.maxDiscountAmount')}
              </label>
              <Input
                id="maxDiscountAmount"
                type="number"
                placeholder={t('promotionsForm.maxDiscountAmount')}
                {...form.register('maxDiscountAmount')}
              />
              {getError('maxDiscountAmount') && (
                <p className="text-xs text-destructive">
                  {getError('maxDiscountAmount')}
                </p>
              )}
            </div>
          )}

          {watchType === 'price' && (
            <div className="space-y-1.5">
              <label htmlFor="minimumOrderAmount" className="text-sm font-medium">
                {t('promotionsForm.minimumOrderAmount')} *
              </label>
              <Input
                id="minimumOrderAmount"
                type="number"
                placeholder={t('promotionsForm.minimumOrderAmount')}
                {...form.register('minimumOrderAmount')}
              />
              {getError('minimumOrderAmount') && (
                <p className="text-xs text-destructive">
                  {getError('minimumOrderAmount')}
                </p>
              )}
            </div>
          )}

          {watchType === 'quantity' && (
            <div className="space-y-1.5">
              <label htmlFor="requiredQuantity" className="text-sm font-medium">
                {t('promotionsForm.requiredQuantity')}
              </label>
              <Input
                id="requiredQuantity"
                type="number"
                placeholder={t('promotionsForm.requiredQuantity')}
                {...form.register('requiredQuantity')}
              />
            </div>
          )}

          {watchTypeAmount === 'gift' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('promotionsForm.giftProducts')}
              </label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2 rounded-lg border p-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <button
                          type="button"
                          className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-transparent px-2.5 py-1 text-xs"
                          onClick={() => {
                            setGiftDropdownOpen(giftDropdownOpen === index ? -1 : index);
                          }}
                        >
                          <span className={giftProductNames[(form.watch(`giftProducts.${index}.product_id`) as number) || 0] ? '' : 'text-muted-foreground'}>
                            {giftProductNames[(form.watch(`giftProducts.${index}.product_id`) as number) || 0] || t('promotionsForm.selectProducts')}
                          </span>
                          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                        </button>
                        {giftDropdownOpen === index && (
                          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                            <div className="relative mb-1">
                              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                placeholder={t('promotionsForm.searchProducts')}
                                value={giftSearch}
                                onChange={(e) => setGiftSearch(e.target.value)}
                                className="h-7 ps-7 text-xs"
                              />
                            </div>
                            <div className="max-h-[150px] overflow-auto">
                              {isSearchingGiftProducts && giftSearch.length > 0 && (
                                <p className="px-2 py-1 text-xs text-muted-foreground">{t('common.loading')}</p>
                              )}
                              {!isSearchingGiftProducts && giftSearch.length > 0 && (giftProductsData?.data?.data || []).length === 0 && (
                                <p className="px-2 py-1 text-xs text-muted-foreground">{t('common.noData')}</p>
                              )}
                              {!isSearchingGiftProducts && (giftProductsData?.data?.data || []).length === 0 && giftSearch.length === 0 && (
                                <p className="px-2 py-1 text-xs text-muted-foreground">{t('promotionsForm.typeToSearch')}</p>
                              )}
                              {(giftProductsData?.data?.data || []).map((product) => (
                                <div
                                  key={product.id}
                                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent"
                                  onClick={() => {
                                    form.setValue(`giftProducts.${index}.product_id` as const, product.id as never);
                                    setGiftProductNames((prev) => ({ ...prev, [product.id]: product.name }));
                                    setGiftDropdownOpen(-1);
                                    setGiftSearch('');
                                  }}
                                >
                                  {product.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <Input
                        placeholder={t('promotionsForm.giftQuantity')}
                        type="number"
                        className="w-20 h-8"
                        {...form.register(`giftProducts.${index}.quantity` as const)}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-0 shrink-0"
                    onClick={() => remove(index)}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  append({ product_id: 0, quantity: 1 });
                }}
              >
                <Search className="mr-1 h-3 w-3" />
                {t('promotionsForm.addGiftProduct')}
              </Button>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('promotionsForm.applyTo')} *
            </label>
              <Select
                value={form.watch('applyTo')}
                onValueChange={(value) => value && form.setValue('applyTo', value)}
              >
              <SelectTrigger>
                <SelectValue placeholder={t('promotionsForm.selectApplyTo')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_products">
                  {t('promotionsForm.allProducts')}
                </SelectItem>
                <SelectItem value="specific_products">
                  {t('promotionsForm.specificProducts')}
                </SelectItem>
              </SelectContent>
            </Select>
            {getError('applyTo') && (
              <p className="text-xs text-destructive">{getError('applyTo')}</p>
            )}
          </div>

          {watchApplyTo === 'specific_products' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t('promotionsForm.products')}
              </label>
              <div className="relative">
                <button
                  type="button"
                  className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-transparent px-2.5 py-1 text-sm"
                  onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
                >
                  <span
                    className={
                      selectedProductIds.length === 0 ? 'text-muted-foreground' : ''
                    }
                  >
                    {selectedProductIds.length === 0
                      ? t('promotionsForm.selectProducts')
                      : selectedProductIds.length +
                        ' ' +
                        t('promotionsForm.productsSelected')}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </button>
                {productsDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                    <div className="relative mb-1">
                      <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={t('promotionsForm.searchProducts')}
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="h-7 ps-7 text-xs"
                      />
                    </div>
                    <div className="max-h-[150px] overflow-auto">
                      {isSearchingProducts && productSearch.length > 0 && (
                        <p className="px-2 py-1 text-xs text-muted-foreground">
                          {t('common.loading')}
                        </p>
                      )}
                      {!isSearchingProducts &&
                        availableProducts.length === 0 &&
                        productSearch.length > 0 && (
                          <p className="px-2 py-1 text-xs text-muted-foreground">
                            {t('common.noData')}
                          </p>
                        )}
                      {!isSearchingProducts &&
                        availableProducts.length === 0 &&
                        productSearch.length === 0 && (
                          <p className="px-2 py-1 text-xs text-muted-foreground">
                            {t('promotionsForm.typeToSearch')}
                          </p>
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
              {getError('productIds') && (
                <p className="text-xs text-destructive">
                  {getError('productIds')}
                </p>
              )}
              {selectedProductIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedProductNames.map((name, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs"
                    >
                      {name}
                      <button
                        type="button"
                        onClick={() => removeProduct(selectedProductIds[i])}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="startAt" className="text-sm font-medium">
                {t('promotionsForm.startAt')} *
              </label>
              <Input
                id="startAt"
                type="date"
                {...form.register('startAt')}
              />
              {getError('startAt') && (
                <p className="text-xs text-destructive">{getError('startAt')}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="endAt" className="text-sm font-medium">
                {t('promotionsForm.endAt')} *
              </label>
              <Input id="endAt" type="date" {...form.register('endAt')} />
              {getError('endAt') && (
                <p className="text-xs text-destructive">{getError('endAt')}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('promotionsForm.status')} *
            </label>
              <Select
                value={form.watch('status')}
                onValueChange={(value) => value && form.setValue('status', value)}
              >
              <SelectTrigger>
                <SelectValue placeholder={t('promotionsForm.status')}>
                  {form.watch('status') === '1'
                    ? t('promotionsForm.active')
                    : t('promotionsForm.inactive')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('promotionsForm.active')}</SelectItem>
                <SelectItem value="0">{t('promotionsForm.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isEditing && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="imageDesktop" className="text-sm font-medium">
                  {t('promotionsForm.desktopImage')}
                </label>
                <Input
                  id="imageDesktop"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(e, 'imageDesktop', setDesktopPreview)
                  }
                />
                {desktopPreview && (
                  <ImagePreview
                    src={desktopPreview}
                    alt="Desktop preview"
                    thumbnailClassName="h-16 rounded border object-cover mt-1"
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="imageMobile" className="text-sm font-medium">
                  {t('promotionsForm.mobileImage')}
                </label>
                <Input
                  id="imageMobile"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(e, 'imageMobile', setMobilePreview)
                  }
                />
                {mobilePreview && (
                  <ImagePreview
                    src={mobilePreview}
                    alt="Mobile preview"
                    thumbnailClassName="h-16 rounded border object-cover mt-1"
                  />
                )}
              </div>
            </div>
          )}

          {!isEditing && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="imageDesktop" className="text-sm font-medium">
                  {t('promotionsForm.desktopImage')} *
                </label>
                <Input
                  id="imageDesktop"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(e, 'imageDesktop', setDesktopPreview)
                  }
                />
                {desktopPreview && (
                  <ImagePreview
                    src={desktopPreview}
                    alt="Desktop preview"
                    thumbnailClassName="h-16 rounded border object-cover mt-1"
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="imageMobile" className="text-sm font-medium">
                  {t('promotionsForm.mobileImage')} *
                </label>
                <Input
                  id="imageMobile"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(e, 'imageMobile', setMobilePreview)
                  }
                />
                {mobilePreview && (
                  <ImagePreview
                    src={mobilePreview}
                    alt="Mobile preview"
                    thumbnailClassName="h-16 rounded border object-cover mt-1"
                  />
                )}
              </div>
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
            <Button type="submit" disabled={isPending || isDetailLoading}>
              {isDetailLoading
                ? t('common.loading')
                : isPending
                  ? isEditing
                    ? t('promotions.updating')
                    : t('promotions.creating')
                  : isEditing
                    ? t('promotionsForm.updatePromotion')
                    : t('promotionsForm.createPromotion')}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
