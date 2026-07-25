import { z } from 'zod';

export const categoryFormSchema = z.object({
  nameEn: z.string().min(1, 'validation.nameEnRequired'),
  nameAr: z.string().min(1, 'validation.nameArRequired'),
  detailsEn: z.string().optional(),
  detailsAr: z.string().optional(),
  imageDesktop: z.instanceof(File).optional(),
  imageMobile: z.instanceof(File).optional(),
  parentId: z.number().nullable().optional(),
  status: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const categoryFormDefaults: CategoryFormValues = {
  nameEn: '',
  nameAr: '',
  detailsEn: '',
  detailsAr: '',
  imageDesktop: undefined,
  imageMobile: undefined,
  parentId: null,
  status: true,
};

export function toApiFormat(values: CategoryFormValues) {
  const details: Record<string, string> = {};
  if (values.detailsEn) details.en = values.detailsEn;
  if (values.detailsAr) details.ar = values.detailsAr;

  return {
    'name[en]': values.nameEn,
    'name[ar]': values.nameAr,
    details: Object.keys(details).length > 0 ? JSON.stringify(details) : undefined,
    'image-desktop': values.imageDesktop,
    'image-mobile': values.imageMobile,
    parent_id: values.parentId,
    status: values.status ? '1' : '0',
  };
}
