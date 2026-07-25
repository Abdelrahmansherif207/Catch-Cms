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
  isFastShipping: z.boolean(),
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
});

export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormValues = z.output<typeof productFormSchema>;
export type VariantFormValues = z.infer<typeof variantFormSchema>;

export const productFormDefaults: ProductFormValues = {
  productType: 'simple',
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
  isFastShipping: false,
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
    is_fast_shipping_available: values.isFastShipping ? '1' : '0',
    'images[]': values.images?.length ? values.images : undefined,
  };

  if (values.productType === 'simple') {
    return {
      ...base,
      price: values.price,
      quantity: values.quantity,
      height: values.height || undefined,
      width: values.width || undefined,
      length: values.length || undefined,
      weight: values.weight || undefined,
    };
  }

  return {
    ...base,
    variants: values.variants.map((v) => ({
      price: v.price,
      quantity: v.quantity,
      sku: v.sku || undefined,
      attribute_values: v.attributeValueIds,
      height: v.height || undefined,
      width: v.width || undefined,
      length: v.length || undefined,
      weight: v.weight || undefined,
    })),
  };
}
