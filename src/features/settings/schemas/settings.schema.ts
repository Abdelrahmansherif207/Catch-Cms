import { z } from 'zod';

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];

const imageFileSchema = z
  .instanceof(File)
  .refine((f) => ALLOWED_IMAGE_TYPES.includes(f.type), 'validation.imageFormat')
  .refine((f) => f.size <= MAX_IMAGE_SIZE, 'validation.imageMaxSize')
  .optional();

export const settingsSchema = z.object({
  siteNameEn: z.string().min(1, 'validation.nameEnRequired'),
  siteNameAr: z.string().min(1, 'validation.nameArRequired'),
  siteDescEn: z.string().optional(),
  siteDescAr: z.string().optional(),
  metaDescEn: z.string().optional(),
  metaDescAr: z.string().optional(),
  siteCopyRightEn: z.string().optional(),
  siteCopyRightAr: z.string().optional(),
  siteEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  emailSupport: z.string().email('Invalid email').optional().or(z.literal('')),
  facebook: z.string().url('Invalid URL').optional().or(z.literal('')),
  instagram: z.string().url('Invalid URL').optional().or(z.literal('')),
  linkedin: z.string().url('Invalid URL').optional().or(z.literal('')),
  promotionVideoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  youtube: z.string().url('Invalid URL').optional().or(z.literal('')),
  phone: z.string().optional(),
  logo: imageFileSchema,
  favicon: imageFileSchema,
  fastShippingPublish: z.string(),
  minimumOrderAmount: z.string(),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

export function toApiFormat(values: SettingsFormValues) {
  return {
    'site_name[en]': values.siteNameEn,
    'site_name[ar]': values.siteNameAr,
    'site_desc[en]': values.siteDescEn || '',
    'site_desc[ar]': values.siteDescAr || '',
    'meta_desc[en]': values.metaDescEn || '',
    'meta_desc[ar]': values.metaDescAr || '',
    'site_copy_right[en]': values.siteCopyRightEn || '',
    'site_copy_right[ar]': values.siteCopyRightAr || '',
    site_email: values.siteEmail || '',
    email_support: values.emailSupport || '',
    facebook: values.facebook || '',
    instagram: values.instagram || '',
    linkedin: values.linkedin || '',
    promotion_video_url: values.promotionVideoUrl || '',
    youtube: values.youtube || '',
    phone: values.phone || '',
    fast_shipping_page_publish: values.fastShippingPublish,
    minimumOrderAmount: values.minimumOrderAmount,
  };
}
