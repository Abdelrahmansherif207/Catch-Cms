import { PERMISSIONS } from '@/shared/auth/permissions';

/** Products have no import/export permissions in the backend enum. */
export const PRODUCT_PERMISSIONS = {
  view: PERMISSIONS.products.view,
  viewDetail: PERMISSIONS.products.viewDetail,
  create: PERMISSIONS.products.create,
  update: PERMISSIONS.products.update,
  delete: PERMISSIONS.products.delete,
} as const;
