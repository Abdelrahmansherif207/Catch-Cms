import { z } from 'zod';

export const flashSaleFormSchema = z.object({
  titleEn: z.string().min(1, 'validation.titleEnRequired'),
  titleAr: z.string().min(1, 'validation.titleArRequired'),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  startDate: z.string().min(1, 'validation.startDateRequired'),
  endDate: z.string().min(1, 'validation.endDateRequired'),
  type: z.string().min(1, 'validation.typeRequired'),
  discount: z.coerce.number().min(0, 'validation.discountMin'),
  maxDiscountAmount: z.coerce.number().optional(),
  status: z.string().default('1'),
  imageDesktop: z.instanceof(File).optional(),
  imageMobile: z.instanceof(File).optional(),
  productIds: z.array(z.number()).optional(),
});

export type FlashSaleFormValues = z.infer<typeof flashSaleFormSchema>;

export const flashSaleFormDefaults: FlashSaleFormValues = {
  titleEn: '',
  titleAr: '',
  descriptionEn: '',
  descriptionAr: '',
  startDate: '',
  endDate: '',
  type: 'percentage',
  discount: 0,
  maxDiscountAmount: undefined,
  status: '1',
  imageDesktop: undefined,
  imageMobile: undefined,
  productIds: [],
};

export function toApiFormat(values: FlashSaleFormValues) {
  return {
    'title[en]': values.titleEn,
    'title[ar]': values.titleAr,
    'description[en]': values.descriptionEn ?? '',
    'description[ar]': values.descriptionAr ?? '',
    start_date: values.startDate,
    end_date: values.endDate,
    type: values.type,
    discount: values.discount.toString(),
    max_discount_amount: values.type === 'percentage' && values.maxDiscountAmount ? values.maxDiscountAmount.toString() : undefined,
    status: values.status,
    'image-desktop': values.imageDesktop,
    'image-mobile': values.imageMobile,
    products: values.productIds && values.productIds.length > 0 ? values.productIds : undefined,
  };
}
