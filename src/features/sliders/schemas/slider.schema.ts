import { z } from 'zod';

export const sliderFormSchema = z.object({
  titleEn: z.string().min(1, 'validation.titleEnRequired'),
  titleAr: z.string().min(1, 'validation.titleArRequired'),
  status: z.string().default('1'),
  imageDesktop: z.instanceof(File).optional(),
  imageMobile: z.instanceof(File).optional(),
  productIds: z.array(z.number()).optional(),
});

export type SliderFormValues = z.infer<typeof sliderFormSchema>;

export const sliderFormDefaults: SliderFormValues = {
  titleEn: '',
  titleAr: '',
  status: '1',
  imageDesktop: undefined,
  imageMobile: undefined,
  productIds: [],
};

export function toApiFormat(values: SliderFormValues) {
  return {
    'title[en]': values.titleEn,
    'title[ar]': values.titleAr,
    status: values.status,
    image_desktop: values.imageDesktop,
    image_mobile: values.imageMobile,
    products: values.productIds && values.productIds.length > 0 ? values.productIds : undefined,
  };
}
