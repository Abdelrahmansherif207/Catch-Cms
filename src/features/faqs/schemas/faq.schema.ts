import { z } from 'zod';

export const faqFormSchema = z.object({
  faqTitleEn: z.string().min(3, 'validation.faqTitleEnRequired'),
  faqTitleAr: z.string().min(3, 'validation.faqTitleArRequired'),
  faqDescriptionEn: z.string().min(3, 'validation.faqDescriptionEnRequired'),
  faqDescriptionAr: z.string().min(3, 'validation.faqDescriptionArRequired'),
});

export type FaqFormValues = z.infer<typeof faqFormSchema>;

export const faqFormDefaults: FaqFormValues = {
  faqTitleEn: '',
  faqTitleAr: '',
  faqDescriptionEn: '',
  faqDescriptionAr: '',
};

export function toApiFormat(values: FaqFormValues) {
  return {
    faq_title: { en: values.faqTitleEn, ar: values.faqTitleAr },
    faq_description: { en: values.faqDescriptionEn, ar: values.faqDescriptionAr },
  };
}
