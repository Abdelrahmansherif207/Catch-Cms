import type { FileOperationKind } from './types';

/**
 * Exact Pusher event names per operation kind (without Echo's leading dot —
 * raw `pusher-js` binds to the `broadcastAs` value verbatim).
 * Contract §28: 6 import events each + 4 export events each (no cancel).
 */
export const FILE_OPERATION_EVENTS: Record<FileOperationKind, string[]> = {
  'product-import': [
    'product.import.queued',
    'product.import.progress',
    'product.import.cancelling',
    'product.import.cancelled',
    'product.import.completed',
    'product.import.failed',
  ],
  'category-import': [
    'category.import.queued',
    'category.import.progress',
    'category.import.cancelling',
    'category.import.cancelled',
    'category.import.completed',
    'category.import.failed',
  ],
  'brand-import': [
    'brand.import.queued',
    'brand.import.progress',
    'brand.import.cancelling',
    'brand.import.cancelled',
    'brand.import.completed',
    'brand.import.failed',
  ],
  'product-export': [
    'product.export.queued',
    'product.export.progress',
    'product.export.completed',
    'product.export.failed',
  ],
  'category-export': [
    'category.export.queued',
    'category.export.progress',
    'category.export.completed',
    'category.export.failed',
  ],
  'brand-export': [
    'brand.export.queued',
    'brand.export.progress',
    'brand.export.completed',
    'brand.export.failed',
  ],
};
