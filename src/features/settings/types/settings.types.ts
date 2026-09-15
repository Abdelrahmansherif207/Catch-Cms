export interface LocalizedString {
  ar: string;
  en: string;
}

export interface FastShippingOptions {
  enabled: boolean | number | string;
  duration_minutes: number | string;
  fee: number | string;
  start_hour: string;
  end_hour: string;
}

export interface SettingsOptions {
  currency: string;
  base_currency_code: string;
  catalog_currency_code: string;
  currency_selection_enabled: boolean;
  fast_shipping?: FastShippingOptions | null;
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
  // Top-level page visibility flag. Backend returns 1/0 (int) — see
  // options.fast_shipping.enabled for the operational flag.
  fast_shipping_page_publish: number | boolean | string;
  // Global order tax (applied at checkout on top of product totals).
  // Backend accepts mixed shapes like other flags: boolean / 1|0 / "1"|"0".
  order_tax_enabled?: boolean | number | string;
  order_tax_rate?: number | string | null;
  minimumOrderAmount: string;
  currency_selection_enabled: boolean | number | string;
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
  order_tax_enabled?: number;
  order_tax_rate?: string | number;
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
  // Nested operational flag. Must be sent together with the sibling keys —
  // the backend replaces the whole fast_shipping object on partial updates.
  'options[fast_shipping][enabled]'?: number;
  'options[fast_shipping][duration_minutes]'?: string | number;
  'options[fast_shipping][fee]'?: string | number;
  'options[fast_shipping][start_hour]'?: string;
  'options[fast_shipping][end_hour]'?: string;
  logo?: File;
  footer_logo?: File;
  favicon?: File;
}
