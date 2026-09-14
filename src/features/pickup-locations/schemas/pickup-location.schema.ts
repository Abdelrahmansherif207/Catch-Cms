import { z } from 'zod';

export const WEEKDAYS = [
  { en: 'Saturday', ar: 'السبت' },
  { en: 'Sunday', ar: 'الأحد' },
  { en: 'Monday', ar: 'الاثنين' },
  { en: 'Tuesday', ar: 'الثلاثاء' },
  { en: 'Wednesday', ar: 'الأربعاء' },
  { en: 'Thursday', ar: 'الخميس' },
  { en: 'Friday', ar: 'الجمعة' },
] as const;

export const CLOSED = 'CLOSED';

export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export const localizedDaySchema = z.object({
  en: z.string().min(1, 'validation.required'),
  ar: z.string().min(1, 'validation.required'),
});

export type LocalizedDayValue = z.infer<typeof localizedDaySchema>;

export interface WorkingHourFormValue {
  day: LocalizedDayValue;
  open: string;
  close: string;
  enabled: boolean;
}

const workingHourSchema = z
  .object({
    day: localizedDaySchema,
    open: z.string(),
    close: z.string(),
    enabled: z.boolean().default(false),
  })
  .superRefine((val, ctx) => {
    if (val.enabled) {
      if (!val.open) {
        ctx.addIssue({ code: 'custom', path: ['open'], message: 'validation.required' });
      } else if (!TIME_REGEX.test(val.open)) {
        ctx.addIssue({ code: 'custom', path: ['open'], message: 'validation.invalidTime' });
      }
      if (!val.close) {
        ctx.addIssue({ code: 'custom', path: ['close'], message: 'validation.required' });
      } else if (!TIME_REGEX.test(val.close)) {
        ctx.addIssue({ code: 'custom', path: ['close'], message: 'validation.invalidTime' });
      }
      if (
        val.open &&
        val.close &&
        TIME_REGEX.test(val.open) &&
        TIME_REGEX.test(val.close) &&
        toMinutes(val.close) <= toMinutes(val.open)
      ) {
        ctx.addIssue({ code: 'custom', path: ['close'], message: 'validation.closeAfterOpen' });
      }
    }
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
  workingHours: z
    .array(workingHourSchema)
    .length(WEEKDAYS.length)
    .superRefine((hours, ctx) => {
      if (!hours.some((h) => h.enabled)) {
        ctx.addIssue({ code: 'custom', message: 'validation.atLeastOneWorkingDay' });
      }
    }),
});

export type PickupLocationFormValues = z.infer<typeof pickupLocationFormSchema>;

function defaultWeek(): WorkingHourFormValue[] {
  return WEEKDAYS.map((day) => ({
    day: { en: day.en, ar: day.ar },
    open: '',
    close: '',
    enabled: false,
  }));
}

export const pickupLocationFormDefaults: PickupLocationFormValues = {
  storeName: '',
  address: '',
  phone: '',
  email: '',
  latitude: '',
  longitude: '',
  status: '1',
  displayOrder: 0,
  workingHours: defaultWeek(),
};

export function weekFromApiHours(
  hours?: Array<{ day: { ar: string; en: string }; open: string; close: string }> | null
): WorkingHourFormValue[] {
  const week = defaultWeek();
  (hours || []).forEach((hour) => {
    const index = week.findIndex((row) => row.day.en === hour.day?.en);
    if (index === -1) return;
    const isClosed = hour.open === CLOSED && hour.close === CLOSED;
    week[index] = {
      ...week[index],
      enabled: !isClosed,
      open: isClosed ? '' : hour.open || '',
      close: isClosed ? '' : hour.close || '',
    };
  });
  return week;
}

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
    working_hours: values.workingHours.map((h) => ({
      day: h.day,
      open: h.enabled ? h.open : CLOSED,
      close: h.enabled ? h.close : CLOSED,
    })),
  };
}
