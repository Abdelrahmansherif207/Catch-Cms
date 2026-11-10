import { z } from 'zod';

const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5MB
const VIDEO_MAX_BYTES = 20 * 1024 * 1024; // 20MB

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/avi', 'video/quicktime'];

/** Returns an i18n key when the uploaded file violates the type rules. */
export function heroMediaError(type: string, file: File): string | undefined {
  const isValidType =
    type === 'video'
      ? ACCEPTED_VIDEO_TYPES.includes(file.type)
      : ACCEPTED_IMAGE_TYPES.includes(file.type);
  if (!isValidType) {
    return type === 'video' ? 'heroes.mediaWrongTypeVideo' : 'heroes.mediaWrongTypeImage';
  }
  const max = type === 'video' ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
  if (file.size > max) return 'heroes.mediaTooLarge';
  return undefined;
}

export const heroFormSchema = z.object({
  type: z.enum(['image', 'video']),
  media: z.instanceof(File).optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  isActive: z.enum(['0', '1']),
});

export type HeroFormValues = z.infer<typeof heroFormSchema>;

export const heroFormDefaults: HeroFormValues = {
  type: 'video',
  media: undefined,
  descriptionEn: '',
  descriptionAr: '',
  isActive: '1',
};
