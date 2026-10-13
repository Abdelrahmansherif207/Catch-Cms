import { z } from 'zod';

const MAX_CODE = 50;
const MAX_NAME = 255;
const MAX_CITY = 100;
const MAX_COUNTRY = 100;

/** Trims and converts empty input to null so optional nullable fields stay clean. */
export function emptyToNull(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const warehouseCreateFormSchema = z
  .object({
    code: z.string().min(1, 'validation.required').max(MAX_CODE, 'validation.codeMaxLength'),
    name: z
      .string()
      .min(1, 'validation.required')
      .max(MAX_NAME, 'validation.nameMaxLength'),
    address: z.string().optional(),
    city: z.string().max(MAX_CITY, 'validation.cityMaxLength').optional(),
    country: z.string().max(MAX_COUNTRY, 'validation.countryMaxLength').optional(),
    status: z.enum(['active', 'inactive']).default('active'),
    isDefault: z.boolean().default(false),
  })
  .superRefine((values, ctx) => {
    // The backend 422s `is_default: true` on an inactive row — mirror the
    // guard client-side so the user never hits a guaranteed failure.
    if (values.isDefault && values.status !== 'active') {
      ctx.addIssue({
        code: 'custom',
        path: ['isDefault'],
        message: 'warehouses.defaultRequiresActive',
      });
    }
  });

export type WarehouseCreateFormValues = z.output<typeof warehouseCreateFormSchema>;

export const warehouseCreateFormDefaults = {
  code: '',
  name: '',
  address: '',
  city: '',
  country: '',
  status: 'active',
  isDefault: false,
} satisfies z.input<typeof warehouseCreateFormSchema>;

export function toCreateApiFormat(
  values: WarehouseCreateFormValues
): import('../types/warehouse.types').CreateWarehouseData {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    address: emptyToNull(values.address) ?? null,
    city: emptyToNull(values.city) ?? null,
    country: emptyToNull(values.country) ?? null,
    status: values.status,
    is_default: values.isDefault,
  };
}

/** Edit forms manage metadata ONLY — code/status/is_default live elsewhere. */
export const warehouseEditFormSchema = z.object({
  name: z
    .string()
    .min(1, 'validation.required')
    .max(MAX_NAME, 'validation.nameMaxLength'),
  address: z.string().optional(),
  city: z.string().max(MAX_CITY, 'validation.cityMaxLength').optional(),
  country: z.string().max(MAX_COUNTRY, 'validation.countryMaxLength').optional(),
});

export type WarehouseEditFormValues = z.output<typeof warehouseEditFormSchema>;

export function toUpdateApiFormat(
  values: WarehouseEditFormValues
): import('../types/warehouse.types').UpdateWarehouseData {
  return {
    name: values.name.trim(),
    address: emptyToNull(values.address) ?? null,
    city: emptyToNull(values.city) ?? null,
    country: emptyToNull(values.country) ?? null,
  };
}
