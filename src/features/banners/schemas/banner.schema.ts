import { z } from 'zod';

export const bannerFormSchema = z.object({
  titleEn: z.string().min(1, 'validation.titleEnRequired'),
  titleAr: z.string().min(1, 'validation.titleArRequired'),
  descriptionEn: z.string().min(1, 'validation.descriptionEnRequired'),
  descriptionAr: z.string().min(1, 'validation.descriptionArRequired'),
  imageDesktop: z.instanceof(File).optional(),
  imageMobile: z.instanceof(File).optional(),
  status: z.string(),
  productIds: z.array(z.number()).optional(),
});

export type BannerFormValues = z.infer<typeof bannerFormSchema>;

export const bannerFormDefaults: BannerFormValues = {
  titleEn: '',
  titleAr: '',
  descriptionEn: '',
  descriptionAr: '',
  imageDesktop: undefined,
  imageMobile: undefined,
  status: '1',
  productIds: [],
};

export function toApiFormat(values: BannerFormValues, isUpdate = false) {
  const apiData: Record<string, unknown> = {
    'title[en]': values.titleEn,
    'title[ar]': values.titleAr,
    'description[en]': values.descriptionEn,
    'description[ar]': values.descriptionAr,
    status: values.status,
  };

  if (!isUpdate || values.imageDesktop) apiData.image_desktop = values.imageDesktop;
  if (!isUpdate || values.imageMobile) apiData.image_mobile = values.imageMobile;
  if (isUpdate) {
    apiData.products = values.productIds || [];
  } else if (values.productIds && values.productIds.length > 0) {
    apiData.products = values.productIds;
  }

  return apiData;
}
