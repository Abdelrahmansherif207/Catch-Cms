/**
 * Canonical Pusher payload for all import/export file operations.
 * Source of truth: backend `BroadcastsFileOperationProgress` — every import
 * AND export event shares these top-level keys, only values differ.
 */
export type FileOperationKind =
  | 'product-import'
  | 'category-import'
  | 'brand-import'
  | 'product-export'
  | 'category-export'
  | 'brand-export';

export type FileOperationState =
  | 'pending'
  | 'processing'
  | 'cancelling'
  | 'completed'
  | 'completed_with_errors'
  | 'failed'
  | 'cancelled';

export interface FileOperationProgressDetail {
  percentage: number;
  processed: number;
  total: number | null;
}

export interface FileOperationEventPayload {
  kind: FileOperationKind;
  operation_type: FileOperationKind;
  /** Same as `operation_id` — use either to match your UI row. */
  id: number;
  /** Equals the `import_id` / `export_id` from the 202 start response. */
  operation_id: number;
  /** Exact event name, e.g. `brand.import.queued`. */
  event: string;
  state: FileOperationState;
  /** Duplicate of `state` for convenience. */
  status: FileOperationState;
  /** 0..100 — use verbatim for the progress bar, never recompute. */
  progress: number;
  /** Duplicate of `progress`. */
  percentage: number;
  progress_detail: FileOperationProgressDetail;
  processed_rows: number;
  success_rows: number;
  failed_rows: number;
  total_rows: number | null;
  has_errors: boolean;
  /**
   * Import: true iff terminal has errors (error report exists).
   * Export: true iff completed artifact exists (validated file).
   */
  download_available: boolean;
  timestamp: string;
  message: string;
}

export const TERMINAL_FILE_OPERATION_STATES: FileOperationState[] = [
  'completed',
  'completed_with_errors',
  'failed',
  'cancelled',
];

export function isTerminalFileOperationState(
  state: string | undefined | null,
): boolean {
  return (
    state === 'completed' ||
    state === 'completed_with_errors' ||
    state === 'failed' ||
    state === 'cancelled'
  );
}
