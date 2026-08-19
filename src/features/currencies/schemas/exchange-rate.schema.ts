import { z } from 'zod';

export const exchangeRateFormSchema = z.object({
  effective_date: z
    .string()
    .min(1, 'validation.effectiveDateRequired'),
  exchange_rate: z
    .number()
    .gt(0, 'validation.exchangeRateGreaterThanZero')
    .lte(999999, 'validation.exchangeRateMaxValue'),
});

export type ExchangeRateFormValues = z.infer<typeof exchangeRateFormSchema>;

export const exchangeRateFormDefaults: ExchangeRateFormValues = {
  effective_date: '',
  exchange_rate: 0,
};
