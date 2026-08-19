import { z } from 'zod';

export const currencyFormSchema = z.object({
  code: z.string().length(3, 'Code must be exactly 3 characters').toUpperCase(),
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  symbolEn: z.string().min(1, 'Symbol is required'),
  symbolAr: z.string().min(1, 'Symbol is required'),
  countryEn: z.string().min(1, 'Country is required'),
  countryAr: z.string().min(1, 'Country is required'),
  numeric_code: z.string().optional(),
  decimal_places: z.number().int().min(0).max(4, 'Max 4 decimal places'),
  icon: z.string().optional(),
  is_active: z.boolean(),
  sort_order: z.number().int().nonnegative(),
});

export type CurrencyFormValues = z.infer<typeof currencyFormSchema>;

export const currencyFormDefaults: CurrencyFormValues = {
  code: '',
  nameEn: '',
  nameAr: '',
  symbolEn: '',
  symbolAr: '',
  countryEn: '',
  countryAr: '',
  numeric_code: '',
  decimal_places: 2,
  icon: '',
  is_active: true,
  sort_order: 0,
};

export function toApiFormat(values: CurrencyFormValues) {
  return {
    code: values.code,
    name: { en: values.nameEn, ar: values.nameAr },
    symbol: { en: values.symbolEn, ar: values.symbolAr },
    country_name: { en: values.countryEn, ar: values.countryAr },
    numeric_code: values.numeric_code || undefined,
    decimal_places: values.decimal_places,
    icon: values.icon || undefined,
    is_active: values.is_active,
    sort_order: values.sort_order,
  };
}