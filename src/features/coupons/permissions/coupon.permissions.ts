import { PERMISSIONS, type Permission } from '@/shared/auth/permissions';

/**
 * Legacy key shape preserved (CAPS keys) while values now come from the
 * canonical catalog — fixes the historical `view-coupon` typo (backend
 * grants `view-coupons`) and wires assignment permissions.
 */
export const COUPON_PERMISSIONS = {
  VIEW: PERMISSIONS.coupons.view,
  VERIFY: PERMISSIONS.coupons.verify,
  CREATE: PERMISSIONS.coupons.create,
  UPDATE: PERMISSIONS.coupons.update,
  DELETE: PERMISSIONS.coupons.delete,
  APPROVE: PERMISSIONS.coupons.approve,
  DISAPPROVE: PERMISSIONS.coupons.disapprove,
  ASSIGN_VIEW: PERMISSIONS.couponAssignments.view,
  ASSIGN_CREATE: PERMISSIONS.couponAssignments.create,
  ASSIGN_UPDATE: PERMISSIONS.couponAssignments.update,
  ASSIGN_DELETE: PERMISSIONS.couponAssignments.delete,
} as const satisfies Record<string, Permission>;
