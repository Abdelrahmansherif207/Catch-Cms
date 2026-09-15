import { z } from 'zod';

export const couponFormSchema = z.object({
  nameEn: z.string().min(1, 'validation.nameEnRequired'),
  nameAr: z.string().min(1, 'validation.nameArRequired'),
  discount: z.coerce.number().min(0, 'validation.discountMin').optional().default(0),
  discountType: z.string().min(1, 'validation.discountTypeRequired'),
  maxDiscountAmount: z.coerce.number().optional(),
  startDate: z.string().min(1, 'validation.startDateRequired'),
  endDate: z.string().min(1, 'validation.endDateRequired'),
  limiter: z.coerce.number().int().min(0).optional(),
  status: z.string().default('1'),
  borderColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, 'validation.invalidColor')
    .optional()
    .or(z.literal('')),
  borderless: z.enum(['0', '1']).optional().default('0'),
  imageDesktop: z.instanceof(File).optional(),
  imageMobile: z.instanceof(File).optional(),
}).superRefine((data, ctx) => {
  if (data.discountType !== 'free_shipping' && (!data.discount || data.discount === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['discount'],
      message: 'validation.discountMin',
    });
  }
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'validation.endDateAfterStartDate',
      });
    }
  }
});

export type CouponFormValues = z.infer<typeof couponFormSchema>;

export function normalizeHexColor(value: string | null | undefined): string {
  if (!value) return '';
  let v = value.trim();
  if (!v) return '';
  if (!v.startsWith('#')) v = '#' + v;
  if (/^#([0-9a-fA-F]{3})$/.test(v)) {
    v = '#' + v.slice(1).split('').map((c) => c + c).join('');
  }
  if (!/^#([0-9a-fA-F]{6})$/.test(v)) return '';
  return v.toLowerCase();
}

export const couponFormDefaults: CouponFormValues = {
  nameEn: '',
  nameAr: '',
  discount: 0,
  discountType: 'percentage',
  maxDiscountAmount: undefined,
  startDate: '',
  endDate: '',
  limiter: undefined,
  status: '1',
  borderColor: '',
  borderless: '0' as const,
  imageDesktop: undefined,
  imageMobile: undefined,
};

export function toCreateApiFormat(values: CouponFormValues) {
  return {
    'name[en]': values.nameEn,
    'name[ar]': values.nameAr,
    ...(values.discountType !== 'free_shipping' ? { discount: values.discount.toString() } : {}),
    discount_type: values.discountType,
    start_date: values.startDate,
    end_date: values.endDate,
    status: values.status,
    'image-desktop': values.imageDesktop!,
    'image-mobile': values.imageMobile!,
    ...(values.discountType === 'percentage' && values.maxDiscountAmount !== undefined ? { max_discount_amount: values.maxDiscountAmount.toString() } : {}),
    ...(values.limiter !== undefined ? { limiter: values.limiter.toString() } : {}),
    ...(values.borderColor ? { border_color: values.borderColor } : {}),
    ...(values.borderless !== undefined ? { borderless: values.borderless } : {}),
  };
}

export function toUpdateApiFormat(values: CouponFormValues) {
  return {
    _method: 'PUT' as const,
    'name[en]': values.nameEn,
    'name[ar]': values.nameAr,
    ...(values.discountType !== 'free_shipping' ? { discount: values.discount.toString() } : {}),
    discount_type: values.discountType,
    start_date: values.startDate,
    end_date: values.endDate,
    status: values.status,
    ...(values.imageDesktop ? { 'image-desktop': values.imageDesktop } : {}),
    ...(values.imageMobile ? { 'image-mobile': values.imageMobile } : {}),
    ...(values.discountType === 'percentage' && values.maxDiscountAmount !== undefined ? { max_discount_amount: values.maxDiscountAmount.toString() } : {}),
    ...(values.limiter !== undefined ? { limiter: values.limiter.toString() } : {}),
    ...(values.borderColor ? { border_color: values.borderColor } : {}),
    ...(values.borderless !== undefined ? { borderless: values.borderless } : {}),
  };
}
