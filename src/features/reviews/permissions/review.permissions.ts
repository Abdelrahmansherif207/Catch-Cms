import { PERMISSIONS } from '@/shared/auth/permissions';

/**
 * The backend has no `view-reviews` grant — visibility is implied by the
 * moderation grants below. `toggleApprove` kept as legacy alias.
 */
export const REVIEW_PERMISSIONS = {
  approve: PERMISSIONS.reviews.approve,
  toggleApprove: PERMISSIONS.reviews.approve,
  delete: PERMISSIONS.reviews.delete,
  deleteSingle: PERMISSIONS.reviews.deleteSingle,
} as const;
