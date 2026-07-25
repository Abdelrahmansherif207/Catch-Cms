import { z } from 'zod';

export const countrySchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  phone_code: z.string().min(1, 'Phone code is required'),
  status: z.string(),
});

export type CountryFormData = z.infer<typeof countrySchema>;

export const countryDefaults: CountryFormData = {
  nameEn: '',
  nameAr: '',
  phone_code: '',
  status: '1',
};

export const governorateSchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  country_id: z.number(),
  status: z.string(),
  shippingPrice: z.string().optional(),
  estimatedDays: z.string().optional(),
  freeShippingOver: z.string().optional(),
});

export type GovernorateFormData = z.infer<typeof governorateSchema>;

export const governorateDefaults: GovernorateFormData = {
  nameEn: '',
  nameAr: '',
  country_id: 0,
  status: '1',
  shippingPrice: '',
  estimatedDays: '',
  freeShippingOver: '',
};

export const citySchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
});

export type CityFormData = z.infer<typeof citySchema>;

export const cityDefaults: CityFormData = {
  nameEn: '',
  nameAr: '',
};
