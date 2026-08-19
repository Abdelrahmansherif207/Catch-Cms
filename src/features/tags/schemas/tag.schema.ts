import { z } from 'zod';

export const tagFormSchema = z.object({
  name: z.string().min(1, 'validation.nameRequired'),
  slug: z.string().optional(),
  image: z.instanceof(File).optional(),
  icon: z.instanceof(File).optional(),
});

export type TagFormValues = z.infer<typeof tagFormSchema>;

export const tagFormDefaults: TagFormValues = {
  name: '',
  slug: '',
  image: undefined,
  icon: undefined,
};

export function toApiFormat(values: TagFormValues) {
  return {
    name: values.name,
    slug: values.slug || undefined,
    image: values.image,
    icon: values.icon,
  };
}
