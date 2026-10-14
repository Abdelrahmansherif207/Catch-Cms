import { PERMISSIONS } from '@/shared/auth/permissions';

/** Task reads AND writes ride on one backend permission: picking-execute. */
export const PICKING_TASK_PERMISSIONS = PERMISSIONS.fulfillments;
