import { z } from 'zod';
import type { BatchDetail, BatchTaskRow } from '../types/batch.types';

/**
 * cancel/retry reason: required + non-blank. The service trims and refuses
 * whitespace-only reasons (' ' passes server min:1 then 422s) — mirror it
 * client-side so operators never hit the doomed request.
 */
export const batchReasonSchema = z.object({
  reason: z
    .string()
    .min(1, 'batches.reasonRequired')
    .max(2000, 'batches.reasonMax')
    .refine((value) => value.trim().length > 0, {
      message: 'batches.reasonRequired',
    }),
});

export type BatchReasonFormValues = z.infer<typeof batchReasonSchema>;

/** assign: explicit worker id required (integer ≥ 1). */
export const assignBatchSchema = z.object({
  user_id: z
    .number({ message: 'batches.assigneeRequired' })
    .int()
    .min(1, 'batches.assigneeRequired'),
  reassign: z.boolean().optional(),
});

export type AssignBatchFormValues = z.infer<typeof assignBatchSchema>;

/** create: 1–100 distinct fulfillment ids (server cap). */
export const createBatchSchema = z.object({
  fulfillment_ids: z
    .array(z.number().int().min(1))
    .min(1, 'batches.pickAtLeastOne')
    .max(100, 'batches.pickTooMany'),
  warehouse_id: z.number().int().min(1).optional(),
});

export type CreateBatchFormValues = z.infer<typeof createBatchSchema>;

/** Open batch states — assignable/startable/pickable/cancellable. */
export function isBatchOpen(status: string): boolean {
  return ['pending', 'assigned', 'picking'].includes(status);
}

/** Tasks still awaiting pick work (pending/assigned/picking). */
export function openBatchTasks(tasks: BatchTaskRow[]): BatchTaskRow[] {
  return tasks.filter((task) => ['pending', 'assigned', 'picking'].includes(task.status));
}

export function skippedBatchTasks(tasks: BatchTaskRow[]): BatchTaskRow[] {
  return tasks.filter((task) => task.status === 'skipped');
}

export function pickedBatchTasks(tasks: BatchTaskRow[]): BatchTaskRow[] {
  return tasks.filter((task) => task.status === 'picked');
}

/** Completion fraction from the server counters (0–100 clamp). */
export function batchProgress(detail: Pick<BatchDetail, 'total_items' | 'picked_items' | 'progress'>): {
  picked: number;
  total: number;
  percent: number;
} {
  const total = detail.total_items || 0;
  const picked = detail.picked_items || 0;
  const percent =
    total > 0 ? Math.min(Math.max(detail.progress ?? (picked / total) * 100, 0), 100) : 0;
  return { picked, total, percent };
}

/** Sequence ladder: "task N of M" for the operator header. */
export function sequencePosition(
  tasks: BatchTaskRow[],
  taskId: number
): { index: number; total: number } {
  const ordered = [...tasks].sort(
    (a, b) => (a.sequence ?? Number.MAX_SAFE_INTEGER) - (b.sequence ?? Number.MAX_SAFE_INTEGER)
  );
  const index = ordered.findIndex((task) => task.id === taskId);
  return { index: index === -1 ? 0 : index + 1, total: ordered.length };
}
