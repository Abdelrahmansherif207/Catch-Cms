import { PERMISSIONS } from '@/shared/auth/permissions';

/** Legacy CAPS key shape preserved. */
export const SLIDER_PERMISSIONS = {
  VIEW: PERMISSIONS.sliders.view,
  CREATE: PERMISSIONS.sliders.create,
  UPDATE: PERMISSIONS.sliders.update,
  DELETE: PERMISSIONS.sliders.delete,
} as const;
