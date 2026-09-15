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
  tiktok: z.string().url('Invalid URL').optional().or(z.literal('')),
  snapchat: z.string().url('Invalid URL').optional().or(z.literal('')),
  phone: z.string().optional(),
  logo: imageFileSchema,
  footerLogo: imageFileSchema,
  favicon: imageFileSchema,
  minimumOrderAmount: z.string(),
  fastShippingPagePublish: z.boolean(),
  currencySelectionEnabled: z.boolean(),
  // Preserved backend fast-shipping config. The toggle controls the `enabled`
  // flag, but fee/duration/hours must be sent back on every save — the API
  // replaces the whole `options.fast_shipping` object on partial updates.
  fastShippingFee: z.string().optional(),
  fastShippingDurationMinutes: z.string().optional(),
  fastShippingStartHour: z.string().optional(),
  fastShippingEndHour: z.string().optional(),
  // Global order tax. Rate is a percentage 0-100, sent as plain value.
  orderTaxEnabled: z.boolean(),
  orderTaxRate: z.coerce.number().min(0).max(100).optional(),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
export type SettingsFormInput = z.input<typeof settingsSchema>;

/**
 * Backend flag normalization. The API returns mixed shapes:
 * boolean true/false, int 1/0, or string "1"/"0" (nested options are stored
 * as strings after a FormData save). Plain Boolean("0") === true, so every
 * toggle must go through this helper.
 */
export function toBooleanFlag(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}

export function toApiFormat(values: SettingsFormInput) {
  const fastShippingEnabled = values.fastShippingPagePublish ? 1 : 0;
  const orderTaxEnabled = values.orderTaxEnabled ? 1 : 0;
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
    tiktok: values.tiktok || undefined,
    snapchat: values.snapchat || undefined,
    phone: values.phone || '',
    minimum_order_amount: values.minimumOrderAmount,
    order_tax_enabled: orderTaxEnabled,
    ...(values.orderTaxEnabled && values.orderTaxRate !== undefined && values.orderTaxRate !== null && values.orderTaxRate !== ''
      ? { order_tax_rate: Number(values.orderTaxRate) }
      : {}),
    // Keep the page flag and the operational nested flag in sync so the UI
    // toggle can never show Active while the backend reports disabled.
    fast_shipping_page_publish: fastShippingEnabled,
    currency_selection_enabled: values.currencySelectionEnabled ? 1 : 0,
    'options[fast_shipping][enabled]': fastShippingEnabled,
    ...(values.fastShippingDurationMinutes !== undefined && values.fastShippingDurationMinutes !== ''
      ? { 'options[fast_shipping][duration_minutes]': values.fastShippingDurationMinutes }
      : {}),
    ...(values.fastShippingFee !== undefined && values.fastShippingFee !== ''
      ? { 'options[fast_shipping][fee]': values.fastShippingFee }
      : {}),
    ...(values.fastShippingStartHour ? { 'options[fast_shipping][start_hour]': values.fastShippingStartHour } : {}),
    ...(values.fastShippingEndHour ? { 'options[fast_shipping][end_hour]': values.fastShippingEndHour } : {}),
  };
}
