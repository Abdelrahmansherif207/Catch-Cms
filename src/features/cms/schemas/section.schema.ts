import { z } from 'zod';
import type { CreateSectionPayload, UpdateSectionPayload } from '../types/section.types';

// ─── Form Schema ─────────────────────────────────────────────────

export const sectionFormSchema = z.object({
  type: z.string().min(1, 'sections.validation.typeRequired'),
  titleEn: z.string().min(1, 'sections.validation.titleEnRequired').max(50),
  titleAr: z.string().min(1, 'sections.validation.titleArRequired').max(50),
  isActive: z.boolean().default(true),
  titleVisible: z.boolean().default(true),
  frontSettings: z.record(z.string(), z.unknown()).optional(),
  backSettings: z.record(z.string(), z.unknown()).optional(),
  productType: z.string().nullable().optional(),
});

export type SectionFormValues = z.infer<typeof sectionFormSchema>;

export const sectionFormDefaults: SectionFormValues = {
  type: '',
  titleEn: '',
  titleAr: '',
  isActive: true,
  titleVisible: true,
  frontSettings: {},
  backSettings: {},
  productType: null,
};

// ─── Transform to API format ─────────────────────────────────────

export function toCreatePayload(values: SectionFormValues): CreateSectionPayload {
  const backSettings = { ...(values.backSettings || {}) };

  // If products type with a template, set the type field
  if (values.type === 'products' && values.productType) {
    backSettings.type = values.productType;
  }

  return {
    type: values.type,
    title: {
      en: values.titleEn,
      ar: values.titleAr,
    },
    endpoint: '', // backend generates this from type + settings
    is_active: values.isActive ? 1 : 0,
    title_visible: values.titleVisible ? 1 : 0,
    setting: {
      front: values.frontSettings || {},
      back: backSettings,
    },
  };
}

export function toUpdatePayload(values: SectionFormValues): UpdateSectionPayload {
  const backSettings = { ...(values.backSettings || {}) };

  if (values.type === 'products' && values.productType) {
    backSettings.type = values.productType;
  }

  return {
    title: {
      en: values.titleEn,
      ar: values.titleAr,
    },
    is_active: values.isActive ? 1 : 0,
    title_visible: values.titleVisible ? 1 : 0,
    setting: {
      front: values.frontSettings || {},
      back: backSettings,
    },
  };
}
