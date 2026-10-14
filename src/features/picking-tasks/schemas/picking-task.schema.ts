import { z } from 'zod';
import type { PickingTaskDetail } from '../types/picking-task.types';

/** record-pick: quantity strictly positive; notes ≤ 2000 (server rule). */
export const recordPickSchema = z.object({
  quantity: z
    .number({ message: 'pickingTasks.pickQtyRequired' })
    .positive('pickingTasks.pickQtyPositive'),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export type RecordPickFormValues = z.infer<typeof recordPickSchema>;

/** confirm: WHERE + WHAT + HOW MUCH, all required scanner strings. */
export const confirmPickSchema = z.object({
  location: z.string().min(1, 'pickingTasks.confirmLocationRequired').max(255),
  product: z.string().min(1, 'pickingTasks.confirmProductRequired').max(255),
  quantity: z
    .number({ message: 'pickingTasks.pickQtyRequired' })
    .positive('pickingTasks.pickQtyPositive'),
});

export type ConfirmPickFormValues = z.infer<typeof confirmPickSchema>;

/** skip: reason required, non-blank (service trims — mirror it). */
export const skipTaskSchema = z.object({
  reason: z
    .string()
    .min(1, 'pickingTasks.skipReasonRequired')
    .max(2000, 'pickingTasks.skipReasonMax')
    .refine((value) => value.trim().length > 0, {
      message: 'pickingTasks.skipReasonRequired',
    }),
});

export type SkipTaskFormValues = z.infer<typeof skipTaskSchema>;

/** reallocate: placement id required (integer ≥ 1). */
export const reallocateTaskSchema = z.object({
  product_location_id: z
    .number({ message: 'pickingTasks.reallocateRequired' })
    .int()
    .min(1, 'pickingTasks.reallocateRequired'),
});

export type ReallocateTaskFormValues = z.infer<typeof reallocateTaskSchema>;

/** Open states = claim/release/confirm/skip/reallocate eligible. */
export function isTaskOpen(status: string): boolean {
  return ['pending', 'assigned', 'picking'].includes(status);
}

/** Helper: picked/total progress from the decimal-string contract. */
export function taskProgress(task: Pick<
  PickingTaskDetail,
  'quantity_to_pick' | 'quantity_picked'
>): { picked: number; total: number; remaining: number } {
  const total = Number(task.quantity_to_pick) || 0;
  const picked = Number(task.quantity_picked) || 0;
  return { picked, total, remaining: Math.max(total - picked, 0) };
}
