import { PERMISSIONS } from '@/shared/auth/permissions';

/**
 * Batch reads ride on view-fulfillment; writes split across two route
 * pipes — batch.manage (create/cancel/retry) and batch.operate
 * (assign/start/complete/refresh). picking-execute holders get NOTHING
 * here without one of these (test-authored lifecycle split).
 */
export const BATCH_PERMISSIONS = PERMISSIONS.batches;
