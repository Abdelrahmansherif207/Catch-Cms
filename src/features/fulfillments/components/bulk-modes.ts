import { PackageCheck, Ship, Waves } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PERMISSIONS, type Permission } from '@/shared/auth/permissions';
import type { FulfillmentStatus } from '../types/fulfillment.types';

export type FulfillmentBulkMode = 'wave' | 'packing' | 'shipping';

export interface FulfillmentBulkModeDef {
  key: FulfillmentBulkMode;
  /** The ONLY status whose rows this mode may select (engine contract). */
  status: FulfillmentStatus;
  labelKey: string;
  hintKey: string;
  /** Selection-bar primary button label ({{count}} interpolated). */
  actionKey: string;
  icon: LucideIcon;
  /** Route-pipe permission that gates the bulk action itself. */
  permission: Permission;
}

/**
 * One bulk-selection mode per fulfillment cycle stage. The mode pins the
 * page's status filter to its eligible status and disables checkboxes on
 * ineligible rows, so the operator can never stage a row the engine would
 * refuse per-item (server still reports refusals in failed[] verbatim).
 */
export const FULFILLMENT_BULK_MODES: FulfillmentBulkModeDef[] = [
  {
    key: 'wave',
    status: 'pending',
    labelKey: 'fulfillments.mode.wave',
    hintKey: 'fulfillments.mode.waveHint',
    actionKey: 'fulfillments.mode.waveAction',
    icon: Waves,
    permission: PERMISSIONS.batches.manage,
  },
  {
    key: 'packing',
    status: 'picked',
    labelKey: 'fulfillments.mode.packing',
    hintKey: 'fulfillments.mode.packingHint',
    actionKey: 'fulfillments.mode.packingAction',
    icon: PackageCheck,
    permission: PERMISSIONS.fulfillments.packingExecute,
  },
  {
    key: 'shipping',
    status: 'ready_to_ship',
    labelKey: 'fulfillments.mode.shipping',
    hintKey: 'fulfillments.mode.shippingHint',
    actionKey: 'fulfillments.mode.shippingAction',
    icon: Ship,
    permission: PERMISSIONS.fulfillments.shipment,
  },
];
