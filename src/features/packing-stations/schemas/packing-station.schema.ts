import { z } from 'zod';
import type { PackingStation, PackingStationStatus } from '../types/packing-station.types';

export const PACKING_STATION_STATUSES: PackingStationStatus[] = [
  'active',
  'inactive',
  'maintenance',
];

export const packingStationFormSchema = z.object({
  /** Create only — omitted on edit (warehouse moves are impossible via API). */
  warehouseId: z.number().int().positive().optional(),
  code: z.string().min(1, 'validation.required').max(50, 'validation.codeMaxLength'),
  name: z
    .string()
    .min(1, 'validation.required')
    .max(100, 'validation.nameMaxLength100'),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
  assignedTo: z.number().int().positive().nullable().optional(),
  dailyCapacity: z
    .number()
    .int()
    .min(1, 'validation.quantityPositive')
    .nullable()
    .optional(),
});

export type PackingStationFormValues = z.infer<typeof packingStationFormSchema>;

export const packingStationFormDefaults: PackingStationFormValues = {
  warehouseId: undefined,
  code: '',
  name: '',
  status: 'active',
  assignedTo: null,
  dailyCapacity: null,
};

export function formValuesFromStation(station: PackingStation): PackingStationFormValues {
  return {
    code: station.code,
    name: station.name,
    status: station.status,
    assignedTo: station.assigned_to ?? null,
    dailyCapacity: station.daily_capacity ?? null,
  };
}
