import { z } from 'zod';

export const attributeValueSchema = z.object({
  valueEn: z.string().min(2, 'validation.attributeValueEnRequired'),
  valueAr: z.string().min(2, 'validation.attributeValueArRequired'),
});

export const attributeFormSchema = z.object({
  nameEn: z.string().min(2, 'validation.attributeNameEnRequired'),
  nameAr: z.string().min(2, 'validation.attributeNameArRequired'),
  values: z.array(attributeValueSchema).optional(),
});

export type AttributeFormValues = z.infer<typeof attributeFormSchema>;
export type AttributeValueFormValues = z.infer<typeof attributeValueSchema>;

export const attributeFormDefaults: AttributeFormValues = {
  nameEn: '',
  nameAr: '',
  values: [],
};

export function toCreateApiFormat(values: AttributeFormValues) {
  return {
    name: { en: values.nameEn, ar: values.nameAr },
    values: values.values && values.values.length > 0
      ? values.values.map((v) => ({ value: { en: v.valueEn, ar: v.valueAr } }))
      : undefined,
  };
}

export function toUpdateApiFormat(values: AttributeFormValues) {
  return {
    name: { en: values.nameEn, ar: values.nameAr },
    values: values.values && values.values.length > 0
      ? values.values.map((v) => ({ value: { en: v.valueEn, ar: v.valueAr } }))
      : [],
  };
}
