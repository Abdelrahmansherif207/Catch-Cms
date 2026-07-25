import { z } from 'zod';

export const workingHourSchema = z.object({
  day: z.string().min(1),
  open: z.string().min(1),
  close: z.string().min(1),
});

export const pickupLocationFormSchema = z.object({
  storeName: z.string().min(1, 'validation.required'),
  address: z.string().min(1, 'validation.required'),
  phone: z.string().min(1, 'validation.required'),
  email: z.string().email('validation.emailInvalid').optional().or(z.literal('')),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  status: z.string().default('1'),
  displayOrder: z.number().int().min(0).default(0),
  workingHours: z.array(workingHourSchema).optional(),
});

export type PickupLocationFormValues = z.infer<typeof pickupLocationFormSchema>;

export const pickupLocationFormDefaults: PickupLocationFormValues = {
  storeName: '',
  address: '',
  phone: '',
  email: '',
  latitude: '',
  longitude: '',
  status: '1',
  displayOrder: 0,
  workingHours: [],
};

export function toApiFormat(values: PickupLocationFormValues) {
  return {
    store_name: values.storeName,
    address: values.address,
    phone: values.phone,
    email: values.email || undefined,
    latitude: values.latitude || undefined,
    longitude: values.longitude || undefined,
    status: values.status,
    display_order: values.displayOrder,
    working_hours: values.workingHours && values.workingHours.length > 0 ? values.workingHours : undefined,
  };
}
