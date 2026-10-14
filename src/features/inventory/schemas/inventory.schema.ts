import { z } from 'zod';
import { MAX_QUANTITY } from '../types/inventory.types';

const MAX_REFERENCE = 255;
const PATTERN_INTEGER = /^\d+$/;

/** Trims optional nullable text (reference) — empty becomes null. */
export function emptyToNull(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const quantityField = z
  .string()
  .trim()
  .min(1, 'validation.required')
  .regex(PATTERN_INTEGER, 'validation.integer')
  .refine((value) => {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= MAX_QUANTITY;
  }, 'inventory.quantityRange');

const referenceField = z.string().max(MAX_REFERENCE, 'inventory.referenceMaxLength');

/**
 * Receive: product + quantity (+ optional reference). The location id rides
 * in the PATH — a form-only value when the dialog has no locked bin.
 *
 * Mirrors server rules: quantity int 1..2147483647 (live-verified 422 text),
 * reference ≤255, idempotency_key ≤64 (uniqueness raced server-side).
 */
export const receiveStockFormSchema = z.object({
  productId: z.string().min(1, 'validation.required'),
  locationId: z.string().min(1, 'validation.required'),
  quantity: quantityField,
  reference: referenceField.optional(),
});

export type ReceiveStockFormValues = z.output<typeof receiveStockFormSchema>;

export const receiveStockFormDefaults: z.input<typeof receiveStockFormSchema> = {
  productId: '',
  locationId: '',
  quantity: '',
  reference: '',
};

/**
 * Transfer: destination must DIFFER from the source and share its warehouse
 * (both refused server-side too — live-verified literals; the refine keeps the
 * dialog from calling the API for the obvious mistakes).
 */
export const transferStockFormSchema = z
  .object({
    productId: z.string().min(1, 'validation.required'),
    sourceLocationId: z.string().min(1, 'validation.required'),
    destinationLocationId: z.string().min(1, 'inventory.selectDestination'),
    quantity: quantityField,
    reference: referenceField.optional(),
  })
  .refine((values) => values.destinationLocationId !== values.sourceLocationId, {
    message: 'inventory.sameLocation',
    path: ['destinationLocationId'],
  });

export type TransferStockFormValues = z.output<typeof transferStockFormSchema>;

export const transferStockFormDefaults: z.input<typeof transferStockFormSchema> = {
  productId: '',
  sourceLocationId: '',
  destinationLocationId: '',
  quantity: '',
  reference: '',
};
