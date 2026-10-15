import { z } from 'zod';

/**
 * assign: station id required, integer ≥ 1 (server rule; NO exists rule —
 * ghost ids 422 in-service with the framework text, shown verbatim).
 */
export const assignPackingTaskSchema = z.object({
  station_id: z
    .number({ message: 'packingTasks.assignStationRequired' })
    .int()
    .min(1, 'packingTasks.assignStationRequired'),
});

export type AssignPackingTaskFormValues = z.infer<typeof assignPackingTaskSchema>;

/**
 * pack: weight strictly > 0; dimensions non-empty numerics (server sends
 * `required|array|min:1` on the map). Clientside we pin the canonical
 * length/width/height trio so the payload shape is predictable.
 */
export const packPackingSchema = z.object({
  weight: z
    .number({ message: 'packingTasks.packWeightRequired' })
    .gt(0, 'packingTasks.packWeightPositive'),
  length: z
    .number({ message: 'packingTasks.packDimsRequired' })
    .positive('packingTasks.packDimsRequired'),
  width: z
    .number({ message: 'packingTasks.packDimsRequired' })
    .positive('packingTasks.packDimsRequired'),
  height: z
    .number({ message: 'packingTasks.packDimsRequired' })
    .positive('packingTasks.packDimsRequired'),
  materials: z.string().max(2000).optional().or(z.literal('')),
  notes: z.string().max(2000, 'packingTasks.packDescription').optional().or(z.literal('')),
});

export type PackPackingFormValues = z.infer<typeof packPackingSchema>;

/** verify: notes optional, ≤ 2000 (server rule). */
export const verifyPackingSchema = z.object({
  notes: z.string().max(2000, 'packingTasks.cancelReasonMax').optional().or(z.literal('')),
});

export type VerifyPackingFormValues = z.infer<typeof verifyPackingSchema>;

/**
 * cancel: reason required, non-blank — mirroring the service trim (a
 * whitespace-only reason passes the server `min:1` then 422s there).
 */
export const cancelPackingTaskSchema = z.object({
  reason: z
    .string()
    .min(1, 'packingTasks.cancelReasonRequired')
    .max(2000, 'packingTasks.cancelReasonMax')
    .refine((value) => value.trim().length > 0, {
      message: 'packingTasks.cancelReasonRequired',
    }),
});

export type CancelPackingTaskFormValues = z.infer<typeof cancelPackingTaskSchema>;

/** Comma-separated free text → string[] for the `materials` array body. */
export function parseMaterials(raw: string): string[] | null {
  const items = raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return items.length > 0 ? items : null;
}
