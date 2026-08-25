import { PERMISSIONS } from '@/shared/auth/permissions';

/** Legacy CAPS key shape preserved; strings corrected to backend enum. */
export const SHIPPING_PERMISSIONS = {
  COUNTRIES_VIEW: PERMISSIONS.shipping.countriesView,
  COUNTRIES_CREATE: PERMISSIONS.shipping.countriesCreate,
  COUNTRIES_UPDATE: PERMISSIONS.shipping.countriesUpdate,
  COUNTRIES_DELETE: PERMISSIONS.shipping.countriesDelete,
  GOVERNORATES_VIEW: PERMISSIONS.shipping.governoratesView,
  GOVERNORATES_CREATE: PERMISSIONS.shipping.governoratesCreate,
  GOVERNORATES_UPDATE: PERMISSIONS.shipping.governoratesUpdate,
  GOVERNORATES_DELETE: PERMISSIONS.shipping.governoratesDelete,
  CITIES_VIEW: PERMISSIONS.shipping.citiesView,
  CITIES_CREATE: PERMISSIONS.shipping.citiesCreate,
  CITIES_UPDATE: PERMISSIONS.shipping.citiesUpdate,
  CITIES_DELETE: PERMISSIONS.shipping.citiesDelete,
  MANAGE_SHIPPING_PRICES: PERMISSIONS.shipping.managePrices,
} as const;
