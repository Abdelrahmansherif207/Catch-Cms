import { z } from 'zod';

/**
 * add-item: identity + strictly positive integer quantity. The remaining
 * cap (picked − already packed) is computed client-side when the picker
 * renders, but the SERVER is the gate — its over-pack 422 is authoritative.
 */
export const addPackageItemSchema = z.object({
  fulfillment_item_id: z
    .number({ message: 'packages.selectItemRequired' })
    .int()
    .min(1, 'packages.selectItemRequired'),
  quantity: z
    .number({ message: 'packages.quantityRequired' })
    .int('packages.quantityPositive')
    .gt(0, 'packages.quantityPositive'),
});

export type AddPackageItemFormValues = z.infer<typeof addPackageItemSchema>;

/** void/package: required non-blank reason — mirrors the service trim. */
export const voidPackageSchema = z.object({
  reason: z
    .string()
    .min(1, 'packages.voidReasonRequired')
    .max(2000, 'packages.voidReasonMax')
    .refine((value) => value.trim().length > 0, {
      message: 'packages.voidReasonRequired',
    }),
});

export type VoidPackageFormValues = z.infer<typeof voidPackageSchema>;

/**
 * Remaining unpacked units for one fulfillment item =
 * quantity_picked − Σ quantity across NON-VOIDED package_items.
 * Voided package_items are excluded from the verify math server-side, so
 * they count back in here too.
 */
export function remainingToPack(
  picked: number | string,
  openPackageDetails: Array<{ items: Array<{ fulfillment_item_id: number; quantity: number }> }> | undefined,
  fulfillmentItemId: number
): number {
  const totalPicked = Number(picked) || 0;
  const packed = (openPackageDetails ?? [])
    .flatMap((model) => model.items)
    .filter((entry) => entry.fulfillment_item_id === fulfillmentItemId)
    .reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);
  return Math.max(totalPicked - packed, 0);
}
