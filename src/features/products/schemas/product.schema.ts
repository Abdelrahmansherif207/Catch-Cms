import { z } from 'zod';

export const variantFormSchema = z.object({
  price: z.coerce.number().positive('validation.pricePositive'),
  quantity: z.coerce.number().int().positive('validation.quantityPositive'),
  sku: z.string().optional(),
  attributeValueIds: z.array(z.number()).min(1, 'validation.atLeastOneAttribute'),
  height: z.coerce.number().optional(),
  width: z.coerce.number().optional(),
  length: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),
});

export const productFormSchema = z.object({
  productType: z.enum(['simple', 'variable']),
  itemType: z.enum(['PHYSICAL', 'DIGITAL']).default('PHYSICAL'),
  taxEnabled: z.boolean().default(false),
  taxRate: z.coerce.number().min(0, 'validation.taxRateRange').max(100, 'validation.taxRateRange').optional(),
  nameEn: z.string().min(1, 'validation.nameEnRequired').max(255, 'validation.nameMaxLength'),
  nameAr: z.string().min(1, 'validation.nameArRequired').max(255, 'validation.nameMaxLength'),
  descriptionEn: z.string().min(1, 'validation.descriptionEnRequired').max(10000, 'validation.descriptionMaxLength'),
  descriptionAr: z.string().min(1, 'validation.descriptionArRequired').max(10000, 'validation.descriptionMaxLength'),
  price: z.coerce.number().optional(),
  quantity: z.coerce.number().int().optional(),
  inStock: z.boolean(),
  status: z.boolean(),
  categoryIds: z.array(z.number()),
  brandIds: z.array(z.number()),
  bannerIds: z.array(z.number()),
  sliderIds: z.array(z.number()),
  hasDiscount: z.boolean(),
  discountStatus: z.boolean(),
  discountType: z.string().optional(),
  discountAmount: z.coerce.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  hasFlashSale: z.boolean(),
  flashSaleId: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  width: z.coerce.number().optional(),
  length: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),
  images: z.array(z.instanceof(File)).optional(),
  variants: z.array(variantFormSchema).default([]),
}).superRefine((data, ctx) => {
  if (data.productType === 'simple') {
    if (!data.price || data.price <= 0) {
      ctx.addIssue({ code: 'custom', path: ['price'], message: 'validation.pricePositive' });
    }
    if (!data.quantity || data.quantity < 1) {
      ctx.addIssue({ code: 'custom', path: ['quantity'], message: 'validation.quantityPositive' });
    }
  }
  if (data.productType === 'variable') {
    if (!data.variants || data.variants.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['variants'], message: 'validation.atLeastOneVariant' });
    }
  }
  if (data.taxEnabled) {
    if (data.taxRate === undefined || data.taxRate === null || Number.isNaN(data.taxRate)) {
      ctx.addIssue({ code: 'custom', path: ['taxRate'], message: 'validation.taxRateRequired' });
    }
  }
});

export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormValues = z.output<typeof productFormSchema>;
export type VariantFormValues = z.infer<typeof variantFormSchema>;

/**
 * Backend flag normalization. The API returns mixed shapes for flags:
 * boolean true/false, int 1/0, or string "1"/"0" (e.g. in_stock).
 * Plain Boolean("0") === true, so every toggle must go through this helper.
 */
export function isTruthyFlag(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}

/**
 * Product status normalization. Besides the flag shapes above, the API
 * returns string enums ("publish", "draft", "unpublish", ...). The CMS
 * models status as a binary Active/Inactive toggle: only "publish"
 * (and the generic truthy shapes) count as active.
 */
export function isActiveStatus(value: unknown): boolean {
  return isTruthyFlag(value) || value === 'publish' || value === 'active';
}

export const productFormDefaults: ProductFormValues = {
  productType: 'simple',
  itemType: 'PHYSICAL',
  taxEnabled: false,
  taxRate: undefined,
  nameEn: '',
  nameAr: '',
  descriptionEn: '',
  descriptionAr: '',
  price: undefined,
  quantity: undefined,
  inStock: true,
  status: true,
  categoryIds: [],
  brandIds: [],
  bannerIds: [],
  sliderIds: [],
  hasDiscount: false,
  discountStatus: true,
  discountType: undefined,
  discountAmount: undefined,
  startDate: undefined,
  endDate: undefined,
  hasFlashSale: false,
  flashSaleId: undefined,
  height: undefined,
  width: undefined,
  length: undefined,
  weight: undefined,
  images: [],
  variants: [],
};

export function toApiFormat(values: ProductFormValues) {
  const base = {
    'name[en]': values.nameEn,
    'name[ar]': values.nameAr,
    'description[en]': values.descriptionEn || undefined,
    'description[ar]': values.descriptionAr || undefined,
    product_type: values.productType,
    item_type: values.itemType,
    tax_enabled: values.taxEnabled ? '1' : '0',
    tax_rate: values.taxEnabled ? values.taxRate : undefined,
    in_stock: values.inStock ? '1' : '0',
    status: values.status ? '1' : '0',
    'categories[]': values.categoryIds,
    'brands[]': values.brandIds,
    'banners[]': values.bannerIds,
    'sliders[]': values.sliderIds,
    has_discount: values.hasDiscount ? '1' : '0',
    discount_status: values.hasDiscount ? (values.discountStatus ? '1' : '0') : undefined,
    discount_type: values.hasDiscount ? (values.discountType || undefined) : undefined,
    discount_amount: values.hasDiscount ? (values.discountAmount || undefined) : undefined,
    start_date: values.hasDiscount ? (values.startDate || undefined) : undefined,
    end_date: values.hasDiscount ? (values.endDate || undefined) : undefined,
    has_flash_sale: values.hasFlashSale ? '1' : '0',
    flash_sale_id: values.hasFlashSale ? (values.flashSaleId || undefined) : undefined,
    'images[]': values.images?.length ? values.images : undefined,
  };

  if (values.productType === 'simple') {
    const isPhysical = values.itemType === 'PHYSICAL';
    return {
      ...base,
      price: values.price,
      quantity: values.quantity,
      height: isPhysical ? values.height || undefined : undefined,
      width: isPhysical ? values.width || undefined : undefined,
      length: isPhysical ? values.length || undefined : undefined,
      weight: isPhysical ? values.weight || undefined : undefined,
    };
  }

  const isPhysical = values.itemType === 'PHYSICAL';
  return {
    ...base,
    variants: values.variants.map((v) => ({
      price: v.price,
      quantity: v.quantity,
      sku: v.sku || undefined,
      attribute_values: v.attributeValueIds,
      height: isPhysical ? v.height || undefined : undefined,
      width: isPhysical ? v.width || undefined : undefined,
      length: isPhysical ? v.length || undefined : undefined,
      weight: isPhysical ? v.weight || undefined : undefined,
    })),
  };
}
