import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2, X, Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { ScrollArea } from '@/shared/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  productFormSchema,
  productFormDefaults,
  toApiFormat,
  type ProductFormInput,
  type ProductFormValues,
} from '../schemas/product.schema';
import { useCreateProduct, useUpdateProduct } from '../hooks/use-products';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { useBrands } from '@/features/brands/hooks/use-brands';
import { useSliders } from '@/features/sliders/hooks/use-sliders';
import { useBanners } from '@/features/banners/hooks/use-banners';
import { useFlashSales } from '@/features/flash-sale/hooks/use-flash-sale';
import { useAttributes } from '@/features/attributes/hooks/use-attributes';
import type { ApiErrorResponse } from '@/shared/api';

interface ProductFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  productId?: number;
  initialValues?: ProductFormValues;
}

interface CheckboxListProps {
  items: { id: number; label: string }[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  searchPlaceholder: string;
  emptyMessage: string;
}

function CheckboxList({ items, selectedIds, onChange, searchPlaceholder, emptyMessage }: CheckboxListProps) {
  const [search, setSearch] = useState('');
  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Input
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <ScrollArea className="h-40 rounded-md border">
        {filtered.length === 0 ? (
          <p className="p-2 text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          filtered.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
            >
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={selectedIds.includes(item.id)}
                onChange={() =>
                  onChange(
                    selectedIds.includes(item.id)
                      ? selectedIds.filter((id) => id !== item.id)
                      : [...selectedIds, item.id]
                  )
                }
              />
              {item.label}
            </label>
          ))
        )}
      </ScrollArea>
      {selectedIds.length > 0 && (
        <p className="text-xs text-muted-foreground">{selectedIds.length} selected</p>
      )}
    </div>
  );
}

function parseLocalizedField(val: string | { en: string; ar: string }): string {
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return parsed.en || parsed.ar || val;
    } catch {
      return val;
    }
  }
  return val.en || val.ar || '';
}

export function ProductForm({ onSuccess, onCancel, productId, initialValues }: ProductFormProps) {
  const { t } = useTranslation();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const isEditMode = !!productId;

  const { data: categoriesData } = useCategories({ perPage: 200 });
  const { data: brandsData } = useBrands({ perPage: 200 });
  const { data: slidersData } = useSliders({ perPage: 200 });
  const { data: bannersData } = useBanners({ perPage: 200 });
  const { data: flashSalesData } = useFlashSales({ perPage: 200 });
  const { data: attributesData } = useAttributes({ perPage: 200 });

  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: productFormDefaults,
  });

  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [initialValues, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  });

  const productType = form.watch('productType');

  const attributeValueItems = useMemo(() => {
    const attributes = attributesData?.data?.data || [];
    const items: { id: number; label: string }[] = [];
    for (const attr of attributes) {
      if (attr.values) {
        const attrName = parseLocalizedField(attr.name);
        for (const val of attr.values) {
          const valueLabel = parseLocalizedField(val.value);
          items.push({ id: val.id, label: `${attrName}: ${valueLabel}` });
        }
      }
    }
    return items;
  }, [attributesData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    form.setValue('images', files);
    const previews: string[] = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        if (previews.length === files.length) {
          setImagePreviews([...previews]);
        }
      };
      reader.readAsDataURL(file);
    });
    if (files.length === 0) {
      setImagePreviews([]);
    }
  };

  const removeImage = (index: number) => {
    const currentImages = form.getValues('images') || [];
    const updated = currentImages.filter((_, i) => i !== index);
    form.setValue('images', updated);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const categories = (categoriesData?.data?.data || []).map((c) => ({
    id: c.id,
    label: c.name,
  }));
  const brands = (brandsData?.data?.data || []).map((b) => ({
    id: b.id,
    label: b.name,
  }));
  const sliders = (slidersData?.data?.data || []).map((s) => ({
    id: s.id,
    label: s.title,
  }));
  const banners = (bannersData?.data?.data || []).map((b) => ({
    id: b.id,
    label: b.title,
  }));
  const flashSales = flashSalesData?.data?.data || [];

  const onSubmit = (values: ProductFormValues) => {
    setServerErrors({});
    const apiData = toApiFormat(values);

    if (isEditMode && productId) {
      updateMutation.mutate({ id: productId, data: { ...apiData, _method: 'PUT' } }, {
        onSuccess: () => {
          onSuccess();
        },
        onError: (error: unknown) => {
          const apiError = error as ApiErrorResponse;
          if (apiError?.status === 422 && apiError.errors) {
            setServerErrors(apiError.errors);
          }
        },
      });
    } else {
      createMutation.mutate(apiData, {
        onSuccess: () => {
          onSuccess();
        },
        onError: (error: unknown) => {
          const apiError = error as ApiErrorResponse;
          if (apiError?.status === 422 && apiError.errors) {
            setServerErrors(apiError.errors);
          }
        },
      });
    }
  };

  const isPending = isEditMode ? updateMutation.isPending : createMutation.isPending;
  const errors = form.formState.errors;

  const getServerError = (field: string): string | undefined => {
    if (serverErrors[field]?.[0]) return serverErrors[field][0];
    const bracketized = field.replace(/\.(\w+)/g, '[$1]');
    if (bracketized !== field && serverErrors[bracketized]?.[0]) return serverErrors[bracketized][0];
    const dotted = field.replace(/\[(\w+)\]/g, '.$1');
    if (dotted !== field && serverErrors[dotted]?.[0]) return serverErrors[dotted][0];
    const snaked = field.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (snaked !== field && serverErrors[snaked]?.[0]) return serverErrors[snaked][0];
    return undefined;
  };

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof ProductFormValues]?.message as string | undefined;
    const serverErr = getServerError(field);
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('productsForm.basicInfo')}
        </h3>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t('productsForm.productType')}</label>
          <Select
            value={form.watch('productType')}
            onValueChange={(value) => form.setValue('productType', value as 'simple' | 'variable')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">{t('productsForm.simple')}</SelectItem>
              <SelectItem value="variable">{t('productsForm.variable')}</SelectItem>
            </SelectContent>
          </Select>
          {getError('productType') && <p className="text-xs text-destructive">{getError('productType')}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="nameEn" className="text-sm font-medium">
              {t('productsForm.nameEn')} *
            </label>
            <Input id="nameEn" placeholder={t('productsForm.nameEn')} {...form.register('nameEn')} />
            {(getError('nameEn') || getError("name[en]")) && (
              <p className="text-xs text-destructive">{getError('nameEn') || getError("name[en]")}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="nameAr" className="text-sm font-medium">
              {t('productsForm.nameAr')} *
            </label>
            <Input id="nameAr" placeholder={t('productsForm.nameAr')} dir="rtl" {...form.register('nameAr')} />
            {(getError('nameAr') || getError("name[ar]")) && (
              <p className="text-xs text-destructive">{getError('nameAr') || getError("name[ar]")}</p>
            )}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="descriptionEn" className="text-sm font-medium">
              {t('productsForm.descriptionEn')}
            </label>
            <Textarea id="descriptionEn" placeholder={t('productsForm.descriptionEn')} rows={2} {...form.register('descriptionEn')} />
            {(getError('descriptionEn') || getError('description[en]')) && (
              <p className="text-xs text-destructive">{getError('descriptionEn') || getError('description[en]')}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="descriptionAr" className="text-sm font-medium">
              {t('productsForm.descriptionAr')}
            </label>
            <Textarea id="descriptionAr" placeholder={t('productsForm.descriptionAr')} dir="rtl" rows={2} {...form.register('descriptionAr')} />
            {(getError('descriptionAr') || getError('description[ar]')) && (
              <p className="text-xs text-destructive">{getError('descriptionAr') || getError('description[ar]')}</p>
            )}
          </div>
        </div>
      </div>

      {productType === 'simple' && (
        <>
          <hr className="border-t" />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t('productsForm.pricing')}
            </h3>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <label htmlFor="price" className="text-sm font-medium">
                  {t('productsForm.price')} *
                </label>
                <Input id="price" type="number" step="0.01" placeholder="0.00" {...form.register('price')} />
                {getError('price') && <p className="text-xs text-destructive">{getError('price')}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="quantity" className="text-sm font-medium">
                  {t('productsForm.quantity')} *
                </label>
                <Input id="quantity" type="number" placeholder="0" {...form.register('quantity')} />
                {getError('quantity') && <p className="text-xs text-destructive">{getError('quantity')}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('productsForm.inStock')}</label>
                <Select
                  value={form.watch('inStock') ? '1' : '0'}
                  onValueChange={(value) => form.setValue('inStock', value === '1')}
                >
                  <SelectTrigger>
                    <SelectValue>{form.watch('inStock') ? t('productsForm.yes') : t('productsForm.no')}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t('productsForm.yes')}</SelectItem>
                    <SelectItem value="0">{t('productsForm.no')}</SelectItem>
                  </SelectContent>
                </Select>
                {getError('inStock') && <p className="text-xs text-destructive">{getError('inStock')}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('productsForm.status')}</label>
                <Select
                  value={form.watch('status') ? '1' : '0'}
                  onValueChange={(value) => form.setValue('status', value === '1')}
                >
                  <SelectTrigger>
                    <SelectValue>{form.watch('status') ? t('productsForm.active') : t('productsForm.inactive')}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t('productsForm.active')}</SelectItem>
                    <SelectItem value="0">{t('productsForm.inactive')}</SelectItem>
                  </SelectContent>
                </Select>
                {getError('status') && <p className="text-xs text-destructive">{getError('status')}</p>}
              </div>
            </div>
          </div>
        </>
      )}

      {productType === 'variable' && (
        <>
          <hr className="border-t" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t('productsForm.variants')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('productsForm.inStock')}:{' '}
                <Select
                  value={form.watch('inStock') ? '1' : '0'}
                  onValueChange={(value) => form.setValue('inStock', value === '1')}
                >
                  <SelectTrigger className="inline-flex h-6 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t('productsForm.yes')}</SelectItem>
                    <SelectItem value="0">{t('productsForm.no')}</SelectItem>
                  </SelectContent>
                </Select>
                {getError('inStock') && <p className="text-xs text-destructive">{getError('inStock')}</p>}
              </p>
            </div>

            {errors.variants?.message && (
              <p className="text-xs text-destructive">{t(errors.variants.message as string)}</p>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="relative rounded-lg border p-4 space-y-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => remove(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t('productsForm.attributeValues')}</label>
                    <CheckboxList
                      items={attributeValueItems}
                      selectedIds={form.watch(`variants.${index}.attributeValueIds`) || []}
                      onChange={(ids) => form.setValue(`variants.${index}.attributeValueIds`, ids)}
                      searchPlaceholder={t('productsForm.searchAttributes')}
                      emptyMessage={t('productsForm.noAttributes')}
                    />
                    {errors.variants?.[index]?.attributeValueIds?.message && (
                      <p className="text-xs text-destructive">{t(errors.variants[index].attributeValueIds.message as string)}</p>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">{t('productsForm.price')} *</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...form.register(`variants.${index}.price`)}
                      />
                      {errors.variants?.[index]?.price?.message && (
                        <p className="text-xs text-destructive">{t(errors.variants[index].price.message as string)}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">{t('productsForm.quantity')} *</label>
                      <Input
                        type="number"
                        placeholder="0"
                        {...form.register(`variants.${index}.quantity`)}
                      />
                      {errors.variants?.[index]?.quantity?.message && (
                        <p className="text-xs text-destructive">{t(errors.variants[index].quantity.message as string)}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">{t('productsForm.sku')}</label>
                      <Input placeholder={t('productsForm.skuPlaceholder')} {...form.register(`variants.${index}.sku`)} />
                      {serverErrors[`variants.${index}.sku`]?.[0] && (
                        <p className="text-xs text-destructive">{serverErrors[`variants.${index}.sku`][0]}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">{t('productsForm.height')}</label>
                      <Input type="number" step="0.01" placeholder="0" {...form.register(`variants.${index}.height`)} />
                      {serverErrors[`variants.${index}.height`]?.[0] && (
                        <p className="text-xs text-destructive">{serverErrors[`variants.${index}.height`][0]}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">{t('productsForm.width')}</label>
                      <Input type="number" step="0.01" placeholder="0" {...form.register(`variants.${index}.width`)} />
                      {serverErrors[`variants.${index}.width`]?.[0] && (
                        <p className="text-xs text-destructive">{serverErrors[`variants.${index}.width`][0]}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">{t('productsForm.length')}</label>
                      <Input type="number" step="0.01" placeholder="0" {...form.register(`variants.${index}.length`)} />
                      {serverErrors[`variants.${index}.length`]?.[0] && (
                        <p className="text-xs text-destructive">{serverErrors[`variants.${index}.length`][0]}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">{t('productsForm.weight')}</label>
                      <Input type="number" step="0.01" placeholder="0" {...form.register(`variants.${index}.weight`)} />
                      {serverErrors[`variants.${index}.weight`]?.[0] && (
                        <p className="text-xs text-destructive">{serverErrors[`variants.${index}.weight`][0]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  price: 0,
                  quantity: 1,
                  sku: '',
                  attributeValueIds: [],
                  height: undefined,
                  width: undefined,
                  length: undefined,
                  weight: undefined,
                })
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              {t('productsForm.addVariant')}
            </Button>
          </div>
        </>
      )}

      <hr className="border-t" />

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('productsForm.relations')}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('productsForm.categories')}</label>
            <CheckboxList
              items={categories}
              selectedIds={form.watch('categoryIds')}
              onChange={(ids) => form.setValue('categoryIds', ids)}
              searchPlaceholder={t('productsForm.searchCategories')}
              emptyMessage={t('productsForm.noCategories')}
            />
            {getError('categoryIds') && <p className="text-xs text-destructive">{getError('categoryIds')}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('productsForm.brands')}</label>
            <CheckboxList
              items={brands}
              selectedIds={form.watch('brandIds')}
              onChange={(ids) => form.setValue('brandIds', ids)}
              searchPlaceholder={t('productsForm.searchBrands')}
              emptyMessage={t('productsForm.noBrands')}
            />
            {getError('brandIds') && <p className="text-xs text-destructive">{getError('brandIds')}</p>}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('productsForm.sliders')}</label>
            <CheckboxList
              items={sliders}
              selectedIds={form.watch('sliderIds')}
              onChange={(ids) => form.setValue('sliderIds', ids)}
              searchPlaceholder={t('productsForm.searchSliders')}
              emptyMessage={t('productsForm.noSliders')}
            />
            {getError('sliderIds') && <p className="text-xs text-destructive">{getError('sliderIds')}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('productsForm.banners')}</label>
            <CheckboxList
              items={banners}
              selectedIds={form.watch('bannerIds')}
              onChange={(ids) => form.setValue('bannerIds', ids)}
              searchPlaceholder={t('productsForm.searchBanners')}
              emptyMessage={t('productsForm.noBanners')}
            />
            {getError('bannerIds') && <p className="text-xs text-destructive">{getError('bannerIds')}</p>}
          </div>
        </div>
      </div>

      <hr className="border-t" />

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('productsForm.discount')}
        </h3>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t('productsForm.hasDiscount')}</label>
          <Select
            value={form.watch('hasDiscount') ? '1' : '0'}
            onValueChange={(value) => {
              form.setValue('hasDiscount', value === '1');
              if (value !== '1') {
                form.setValue('discountType', undefined);
                form.setValue('discountAmount', undefined);
                form.setValue('startDate', undefined);
                form.setValue('endDate', undefined);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue>{form.watch('hasDiscount') ? t('productsForm.yes') : t('productsForm.no')}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{t('productsForm.yes')}</SelectItem>
              <SelectItem value="0">{t('productsForm.no')}</SelectItem>
            </SelectContent>
          </Select>
          {getError('hasDiscount') && <p className="text-xs text-destructive">{getError('hasDiscount')}</p>}
        </div>

        {form.watch('hasDiscount') && (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('productsForm.discountType')}</label>
                <Select
                  value={form.watch('discountType') || ''}
                  onValueChange={(value) => form.setValue('discountType', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('productsForm.selectDiscountType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed_rate">{t('productsForm.fixed')}</SelectItem>
                    <SelectItem value="percentage">{t('productsForm.percentage')}</SelectItem>
                  </SelectContent>
                </Select>
                {getError('discountType') && <p className="text-xs text-destructive">{getError('discountType')}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="discountAmount" className="text-sm font-medium">
                  {t('productsForm.discountAmount')}
                </label>
                <Input
                  id="discountAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...form.register('discountAmount')}
                />
                {getError('discountAmount') && <p className="text-xs text-destructive">{getError('discountAmount')}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('productsForm.discountStatus')}</label>
              <Select
                value={form.watch('discountStatus') ? '1' : '0'}
                onValueChange={(value) => form.setValue('discountStatus', value === '1')}
              >
                <SelectTrigger>
                  <SelectValue>{form.watch('discountStatus') ? t('productsForm.active') : t('productsForm.inactive')}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('productsForm.active')}</SelectItem>
                  <SelectItem value="0">{t('productsForm.inactive')}</SelectItem>
                </SelectContent>
              </Select>
              {getError('discountStatus') && <p className="text-xs text-destructive">{getError('discountStatus')}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="startDate" className="text-sm font-medium">
                  {t('productsForm.startDate')}
                </label>
                <Input id="startDate" type="datetime-local" {...form.register('startDate')} />
                {getError('startDate') && <p className="text-xs text-destructive">{getError('startDate')}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="endDate" className="text-sm font-medium">
                  {t('productsForm.endDate')}
                </label>
                <Input id="endDate" type="datetime-local" {...form.register('endDate')} />
                {getError('endDate') && <p className="text-xs text-destructive">{getError('endDate')}</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      <hr className="border-t" />

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('productsForm.flashSale')}
        </h3>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t('productsForm.hasFlashSale')}</label>
          <Select
            value={form.watch('hasFlashSale') ? '1' : '0'}
            onValueChange={(value) => {
              form.setValue('hasFlashSale', value === '1');
              if (value !== '1') {
                form.setValue('flashSaleId', undefined);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue>{form.watch('hasFlashSale') ? t('productsForm.yes') : t('productsForm.no')}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{t('productsForm.yes')}</SelectItem>
              <SelectItem value="0">{t('productsForm.no')}</SelectItem>
            </SelectContent>
          </Select>
          {getError('hasFlashSale') && <p className="text-xs text-destructive">{getError('hasFlashSale')}</p>}
        </div>

        {form.watch('hasFlashSale') && (
          <div className="rounded-lg border p-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('productsForm.flashSaleSelect')}</label>
              <Select
                value={form.watch('flashSaleId')?.toString() || ''}
                onValueChange={(value) => form.setValue('flashSaleId', Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('productsForm.selectFlashSale')} />
                </SelectTrigger>
                <SelectContent>
                  {flashSales.map((fs) => (
                    <SelectItem key={fs.id} value={fs.id.toString()}>
                      {fs.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getError('flashSaleId') && <p className="text-xs text-destructive">{getError('flashSaleId')}</p>}
            </div>
          </div>
        )}
      </div>

      {productType === 'simple' && (
        <>
          <hr className="border-t" />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t('productsForm.shipping')}
            </h3>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              <div className="space-y-1.5">
                <label htmlFor="height" className="text-sm font-medium">{t('productsForm.height')}</label>
                <Input id="height" type="number" step="0.01" placeholder="0" {...form.register('height')} />
                {getError('height') && <p className="text-xs text-destructive">{getError('height')}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="width" className="text-sm font-medium">{t('productsForm.width')}</label>
                <Input id="width" type="number" step="0.01" placeholder="0" {...form.register('width')} />
                {getError('width') && <p className="text-xs text-destructive">{getError('width')}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="length" className="text-sm font-medium">{t('productsForm.length')}</label>
                <Input id="length" type="number" step="0.01" placeholder="0" {...form.register('length')} />
                {getError('length') && <p className="text-xs text-destructive">{getError('length')}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="weight" className="text-sm font-medium">{t('productsForm.weight')}</label>
                <Input id="weight" type="number" step="0.01" placeholder="0" {...form.register('weight')} />
                {getError('weight') && <p className="text-xs text-destructive">{getError('weight')}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('productsForm.fastShipping')}</label>
              <Select
                value={form.watch('isFastShipping') ? '1' : '0'}
                onValueChange={(value) => form.setValue('isFastShipping', value === '1')}
              >
                <SelectTrigger>
                  <SelectValue>{form.watch('isFastShipping') ? t('productsForm.yes') : t('productsForm.no')}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('productsForm.yes')}</SelectItem>
                  <SelectItem value="0">{t('productsForm.no')}</SelectItem>
                </SelectContent>
              </Select>
              {getError('isFastShipping') && <p className="text-xs text-destructive">{getError('isFastShipping')}</p>}
            </div>
          </div>
        </>
      )}

      <hr className="border-t" />

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('productsForm.images')}
        </h3>
        <div className="space-y-1.5">
          <label htmlFor="images" className="text-sm font-medium">
            {t('productsForm.uploadImages')}
          </label>
          <Input
            id="images"
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
          />
          {getError('images') && <p className="text-xs text-destructive">{getError('images')}</p>}
        </div>
        {imagePreviews.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {imagePreviews.map((src, i) => (
              <div key={i} className="relative group">
                <img
                  src={src}
                  alt={`Preview ${i + 1}`}
                  className="h-20 w-20 rounded-md border object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive p-0.5 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('common.loading')}
            </>
          ) : (
            t(isEditMode ? 'productsForm.editProduct' : 'productsForm.createProduct')
          )}
        </Button>
      </div>
    </form>
  );
}
