export interface Settings {
  site_name: string;
  site_desc: string;
  meta_desc: string;
  site_copy_right: string;
  logo: string;
  favicon: string;
  site_email: string;
  email_support: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  promotion_video_url: string;
  youtube: string;
  phone: string;
  fast_shipping_page_publish: number;
  minimumOrderAmount: number;
  options: Record<string, any> | null;
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
  fast_shipping_page_publish?: string | number;
  minimumOrderAmount?: string | number;
  site_email: string;
  email_support: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  promotion_video_url: string;
  youtube: string;
  phone: string;
  logo?: File;
  favicon?: File;
}
