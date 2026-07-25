import { z } from 'zod';

export const roleFormSchema = z.object({
  name: z.string().optional(),
  displayNameEn: z.string().min(1, 'validation.nameEnRequired'),
  displayNameAr: z.string().min(1, 'validation.nameArRequired'),
  permissionIds: z.array(z.number()).default([]),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;

export const roleFormDefaults: RoleFormValues = {
  name: '',
  displayNameEn: '',
  displayNameAr: '',
  permissionIds: [],
};

export function autoGenerateName(displayNameEn: string): string {
  return displayNameEn
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function toApiFormat(values: RoleFormValues) {
  return {
    display_name: {
      en: values.displayNameEn,
      ar: values.displayNameAr,
    },
  };
}

export function parseDisplayName(displayName: string): { en: string; ar: string } {
  try {
    const parsed = JSON.parse(displayName);
    return { en: parsed.en || '', ar: parsed.ar || '' };
  } catch {
    return { en: displayName, ar: displayName };
  }
}
