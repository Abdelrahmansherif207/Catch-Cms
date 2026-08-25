import { z } from 'zod';
import type {
  CorrectInvoicePayload,
  CancelInvoicePayload,
  DebitNotePayload,
} from '../types/invoice.types';

export const correctInvoiceFormSchema = z.object({
  reason: z.string().min(1, 'invoices.validation.reasonRequired'),
  total: z.string().optional(),
  amount_paid: z.string().optional(),
  shipping: z.string().optional(),
  customer_name: z.string().optional(),
  customer_email: z.string().email('invoices.validation.emailInvalid').or(z.literal('')).optional(),
  customer_phone: z.string().optional(),
  billing_name: z.string().optional(),
  billing_line1: z.string().optional(),
  billing_line2: z.string().optional(),
  billing_city: z.string().optional(),
  billing_state: z.string().optional(),
  billing_country: z.string().optional(),
  billing_postal_code: z.string().optional(),
  shipping_name: z.string().optional(),
  shipping_line1: z.string().optional(),
  shipping_line2: z.string().optional(),
  shipping_city: z.string().optional(),
  shipping_state: z.string().optional(),
  shipping_country: z.string().optional(),
  shipping_postal_code: z.string().optional(),
  notes: z.string().optional(),
});

export type CorrectInvoiceFormValues = z.infer<typeof correctInvoiceFormSchema>;

export const correctInvoiceFormDefaults: CorrectInvoiceFormValues = {
  reason: '',
  total: '',
  amount_paid: '',
  shipping: '',
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  billing_name: '',
  billing_line1: '',
  billing_line2: '',
  billing_city: '',
  billing_state: '',
  billing_country: '',
  billing_postal_code: '',
  shipping_name: '',
  shipping_line1: '',
  shipping_line2: '',
  shipping_city: '',
  shipping_state: '',
  shipping_country: '',
  shipping_postal_code: '',
  notes: '',
};

function toOptionalNumber(value?: string): number | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}

export function toCorrectInvoicePayload(values: CorrectInvoiceFormValues): CorrectInvoicePayload {
  const payload: CorrectInvoicePayload = { reason: values.reason };
  const overrides: CorrectInvoicePayload['overrides'] = {};
  const total = toOptionalNumber(values.total);
  const amountPaid = toOptionalNumber(values.amount_paid);
  const shipping = toOptionalNumber(values.shipping);

  if (total !== undefined) overrides.total = total;
  if (amountPaid !== undefined) overrides.amount_paid = amountPaid;
  if (shipping !== undefined) overrides.shipping_price = shipping;
  if (values.customer_name?.trim() || values.customer_email?.trim() || values.customer_phone?.trim()) {
    overrides.customer = {
      ...(values.customer_name?.trim() ? { name: values.customer_name.trim() } : {}),
      ...(values.customer_email?.trim() ? { email: values.customer_email.trim() } : {}),
      ...(values.customer_phone?.trim() ? { phone: values.customer_phone.trim() } : {}),
    };
  }

  const billing = {
    name: values.billing_name?.trim(),
    line1: values.billing_line1?.trim(),
    line2: values.billing_line2?.trim(),
    city: values.billing_city?.trim(),
    state: values.billing_state?.trim(),
    country: values.billing_country?.trim(),
    postal_code: values.billing_postal_code?.trim(),
  };
  if (Object.values(billing).some(Boolean)) {
    overrides.billing_address = Object.fromEntries(
      Object.entries(billing).filter(([, v]) => Boolean(v))
    ) as Record<string, string>;
  }

  const shippingAddr = {
    name: values.shipping_name?.trim(),
    line1: values.shipping_line1?.trim(),
    line2: values.shipping_line2?.trim(),
    city: values.shipping_city?.trim(),
    state: values.shipping_state?.trim(),
    country: values.shipping_country?.trim(),
    postal_code: values.shipping_postal_code?.trim(),
  };
  if (Object.values(shippingAddr).some(Boolean)) {
    overrides.shipping_address = Object.fromEntries(
      Object.entries(shippingAddr).filter(([, v]) => Boolean(v))
    ) as Record<string, string>;
  }

  if (values.notes?.trim()) overrides.notes = values.notes.trim();

  if (Object.keys(overrides).length > 0) {
    payload.overrides = overrides;
  }

  return payload;
}

export const cancelInvoiceFormSchema = z.object({
  reason: z
    .string()
    .min(1, 'invoices.validation.reasonRequired')
    .max(500, 'invoices.validation.reasonMax'),
  confirm: z.literal(true, { error: 'invoices.validation.confirmRequired' }),
});

export type CancelInvoiceFormValues = z.infer<typeof cancelInvoiceFormSchema>;

export const cancelInvoiceFormDefaults: CancelInvoiceFormValues = {
  reason: '',
  confirm: false as unknown as true,
};

export function toCancelInvoicePayload(values: CancelInvoiceFormValues): CancelInvoicePayload {
  return { reason: values.reason.trim() };
}

export const debitNoteFormSchema = z.object({
  amount: z.string().min(1, 'invoices.validation.amountRequired').refine(
    (v) => {
      const num = Number(v);
      return !Number.isNaN(num) && num >= 0.01;
    },
    { message: 'invoices.validation.amountMin' }
  ),
  reason: z.string().min(1, 'invoices.validation.reasonRequired'),
});

export type DebitNoteFormValues = z.infer<typeof debitNoteFormSchema>;

export const debitNoteFormDefaults: DebitNoteFormValues = {
  amount: '',
  reason: '',
};

export function toDebitNotePayload(values: DebitNoteFormValues): DebitNotePayload {
  return { amount: Number(values.amount), reason: values.reason.trim() };
}