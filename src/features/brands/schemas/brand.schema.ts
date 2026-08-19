import { z } from 'zod';

export const brandFormSchema = z.object({
  nameEn: z.string().min(1, 'validation.nameEnRequired'),
  nameAr: z.string().min(1, 'validation.nameArRequired'),
  detailsEn: z.string().optional(),
  detailsAr: z.string().optional(),
  imageDesktop: z.instanceof(File).optional(),
  imageMobile: z.instanceof(File).optional(),
  status: z.string().default('1'),
  productIds: z.array(z.number()).optional(),
});

export type BrandFormValues = z.infer<typeof brandFormSchema>;

export const brandFormDefaults: BrandFormValues = {
  nameEn: '',
  nameAr: '',
  detailsEn: '',
  detailsAr: '',
  imageDesktop: undefined,
  imageMobile: undefined,
  status: '1',
  productIds: [],
};

export function toApiFormat(values: BrandFormValues) {
  return {
    'name[en]': values.nameEn,
    'name[ar]': values.nameAr,
    'details[en]': values.detailsEn || undefined,
    'details[ar]': values.detailsAr || undefined,
    'image-desktop': values.imageDesktop,
    'image-mobile': values.imageMobile,
    status: values.status,
    products: values.productIds && values.productIds.length > 0 ? values.productIds : undefined,
  };
}
