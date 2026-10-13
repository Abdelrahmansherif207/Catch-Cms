import { z } from 'zod';
import { LOCATION_TYPES } from '../types/location.types';

const MAX_CODE = 50;
const MAX_NAME = 255;
const MAX_BARCODE = 255;

/** Trims and converts empty input to null so optional nullable fields stay clean. */
export function emptyToNull(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const PATTERN_INTEGER = /^-?\d+$/;

/**
 * Create form mirrors the backend contract:
 * - warehouse_id: required (validated `exists:warehouses,id` server-side)
 * - code: required, max 50, unique PER WAREHOUSE (same code in another
 *   warehouse is fine — live-verified 201)
 * - name: required plain string, max 255 (NOT bilingual)
 * - parent_id: optional, must exist AND belong to the same warehouse
 *   (cross-warehouse → verbatim 422 literal server-side)
 * - barcode: optional, max 255, NO uniqueness
 * - type: optional one of the eight types (anything else 422s)
 * - priority: optional integer, no min/max (negatives accepted live)
 */
export const locationCreateFormSchema = z.object({
  warehouseId: z.string().min(1, 'validation.required'),
  code: z.string().min(1, 'validation.required').max(MAX_CODE, 'validation.codeMaxLength'),
  name: z
    .string()
    .min(1, 'validation.required')
    .max(MAX_NAME, 'validation.nameMaxLength'),
  parentId: z.string().optional(),
  barcode: z.string().max(MAX_BARCODE, 'locations.barcodeMaxLength').optional(),
  type: z.enum(LOCATION_TYPES).or(z.literal('')).optional(),
  priority: z.string().optional(),
});

export type LocationCreateFormValues = z.output<typeof locationCreateFormSchema>;

export const locationCreateFormDefaults = {
  warehouseId: '',
  code: '',
  name: '',
  parentId: '',
  barcode: '',
  type: '',
  priority: '',
} satisfies z.input<typeof locationCreateFormSchema>;

export function toCreateApiFormat(
  values: LocationCreateFormValues
): import('../types/location.types').CreateLocationData {
  const trimmedPriority = (values.priority ?? '').trim();
  return {
    warehouse_id: values.warehouseId,
    code: values.code.trim(),
    name: values.name.trim(),
    parent_id: values.parentId ? Number(values.parentId) : null,
    barcode: emptyToNull(values.barcode) ?? null,
    type: values.type ? values.type : null,
    priority:
      PATTERN_INTEGER.test(trimmedPriority) && trimmedPriority.length > 0
        ? Number(trimmedPriority)
        : null,
    metadata: null,
  };
}

/**
 * Edit form manages metadata ONLY — the warehouse and the code are permanent
 * and the lifecycle status is owned by activate/deactivate commands.
 * `name` is effectively required on PUT (`sometimes|required` server-side).
 */
export const locationEditFormSchema = z.object({
  name: z
    .string()
    .min(1, 'validation.required')
    .max(MAX_NAME, 'validation.nameMaxLength'),
  parentId: z.string().optional(),
  barcode: z.string().max(MAX_BARCODE, 'locations.barcodeMaxLength').optional(),
  type: z.enum(LOCATION_TYPES).or(z.literal('')).optional(),
  priority: z.string().optional(),
});

export type LocationEditFormValues = z.output<typeof locationEditFormSchema>;

export function toUpdateApiFormat(
  values: LocationEditFormValues
): import('../types/location.types').UpdateLocationData {
  const trimmedPriority = (values.priority ?? '').trim();
  return {
    name: values.name.trim(),
    parent_id: values.parentId ? Number(values.parentId) : null,
    barcode: emptyToNull(values.barcode) ?? null,
    type: values.type ? values.type : null,
    priority:
      PATTERN_INTEGER.test(trimmedPriority) && trimmedPriority.length > 0
        ? Number(trimmedPriority)
        : null,
    metadata: null,
  };
}
