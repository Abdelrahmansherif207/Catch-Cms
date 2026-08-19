import { z } from 'zod';

export const promotionFormSchema = z
  .object({
    nameEn: z.string().min(1, 'validation.nameEnRequired'),
    nameAr: z.string().min(1, 'validation.nameArRequired'),
    imageDesktop: z.instanceof(File).optional(),
    imageMobile: z.instanceof(File).optional(),
    type: z.string(),
    typeAmount: z.string(),
    discount: z.string().min(1, 'validation.discountRequired'),
    minimumOrderAmount: z.string().optional(),
    maxDiscountAmount: z.string().optional(),
    requiredQuantity: z.string().optional(),
    applyTo: z.string(),
    productIds: z.array(z.number()).optional(),
    giftProducts: z
      .array(
        z.object({
          product_id: z.number(),
          quantity: z.number(),
        })
      )
      .optional(),
    startAt: z.string().min(1, 'validation.startAtRequired'),
    endAt: z.string().min(1, 'validation.endAtRequired'),
    status: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'price' && (!data.minimumOrderAmount || data.minimumOrderAmount === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minimumOrderAmount'],
        message: 'validation.minimumOrderAmountRequired',
      });
    }
    if (data.typeAmount === 'percentage' && !data.maxDiscountAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxDiscountAmount'],
        message: 'validation.maxDiscountAmountRequired',
      });
    }
    if (data.applyTo === 'specific_products' && (!data.productIds || data.productIds.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['productIds'],
        message: 'validation.productIdsRequired',
      });
    }
  });

export type PromotionFormValues = z.infer<typeof promotionFormSchema>;

export const promotionFormDefaults: PromotionFormValues = {
  nameEn: '',
  nameAr: '',
  imageDesktop: undefined,
  imageMobile: undefined,
  type: 'price',
  typeAmount: 'fixed_rate',
  discount: '',
  minimumOrderAmount: '',
  maxDiscountAmount: '',
  requiredQuantity: '',
  applyTo: 'all_products',
  productIds: [],
  giftProducts: [],
  startAt: '',
  endAt: '',
  status: '1',
};

export function toApiFormat(values: PromotionFormValues, isUpdate = false) {
  const apiData: Record<string, unknown> = {
    'name[en]': values.nameEn,
    'name[ar]': values.nameAr,
    type: values.type,
    type_amount: values.typeAmount,
    discount: values.discount,
    apply_to: values.applyTo,
    start_at: values.startAt,
    end_at: values.endAt,
    status: values.status,
  };

  if (values.type === 'price') {
    apiData.minimum_order_amount = values.minimumOrderAmount || '0';
  }
  if (values.type === 'quantity') {
    apiData.required_quantity = values.requiredQuantity || '1';
  }
  if (!isUpdate || values.imageDesktop) apiData.image_desktop = values.imageDesktop;
  if (!isUpdate || values.imageMobile) apiData.image_mobile = values.imageMobile;
  if (values.maxDiscountAmount) apiData.max_discount_amount = values.maxDiscountAmount;
  if (values.productIds && values.productIds.length > 0) {
    apiData.product_ids = values.productIds;
  }
  if (values.giftProducts && values.giftProducts.length > 0) {
    apiData.gift_products = values.giftProducts;
  }

  return apiData;
}
