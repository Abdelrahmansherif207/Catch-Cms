export interface LocalizedString {
  ar: string;
  en: string;
}

export interface SettingsOptions {
  currency: string;
  base_currency_code: string;
  catalog_currency_code: string;
  currency_selection_enabled: boolean;
}

export interface Settings {
  site_name: LocalizedString;
  site_desc: LocalizedString;
  meta_desc: LocalizedString;
  site_copy_right: LocalizedString;
  logo: string;
  footer_logo: string;
  favicon: string;
  site_email: string;
  email_support: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  promotion_video_url: string;
  youtube: string;
  tiktok: string | null;
  snapchat: string | null;
  phone: string;
  fast_shipping_page_publish: number;
  minimumOrderAmount: string;
  currency_selection_enabled: boolean;
  options: SettingsOptions | null;
}

export interface SettingsResponse {
  status: number;
  message: string;
  success: boolean;
  data: Settings;
}

export interface UpdateSettingsPayload {
  'site_name[en]': string;
  'site_name[ar]': string;
  'site_desc[en]': string;
  'site_desc[ar]': string;
  'meta_desc[en]': string;
  'meta_desc[ar]': string;
  'site_copy_right[en]': string;
  'site_copy_right[ar]': string;
  minimum_order_amount?: string | number;
  site_email: string;
  email_support: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  promotion_video_url: string;
  youtube: string;
  tiktok?: string;
  snapchat?: string;
  phone: string;
  fast_shipping_page_publish?: number;
  currency_selection_enabled?: number;
  logo?: File;
  footer_logo?: File;
  favicon?: File;
}
