import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import {
  faqFormSchema,
  faqFormDefaults,
  toApiFormat,
  type FaqFormValues,
} from '../schemas/faq.schema';
import { useCreateFaq, useUpdateFaq, useFaq } from '../hooks/use-faqs';
import type { Faq } from '../types/faq.types';
import type { ApiErrorResponse } from '@/shared/api';

interface FaqFormDialogProps {
  faq?: Faq | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function FaqFormDialog({
  faq,
  open,
  onOpenChange,
  onSuccess,
}: FaqFormDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!faq;
  const createMutation = useCreateFaq();
  const updateMutation = useUpdateFaq();
  const { data: faqDetail, isLoading: isDetailLoading } = useFaq(faq?.id ?? 0);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const form = useForm<FaqFormValues>({
    resolver: zodResolver(faqFormSchema),
    defaultValues: faqFormDefaults,
  });

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setServerErrors({});
      form.reset(faqFormDefaults);
    }
    prevOpenRef.current = open;
  }, [open, form]);

  useEffect(() => {
    if (isEditing && faq && faqDetail?.data) {
      const d = faqDetail.data;
      let parsedTitle: Record<string, string> = {};
      try {
        parsedTitle = typeof d.faq_title === 'string' ? JSON.parse(d.faq_title) : d.faq_title;
      } catch {
        parsedTitle = { en: d.faq_title, ar: d.faq_title };
      }
      let parsedDescription: Record<string, string> = {};
      try {
        parsedDescription = typeof d.faq_description === 'string' ? JSON.parse(d.faq_description) : d.faq_description;
      } catch {
        parsedDescription = { en: d.faq_description, ar: d.faq_description };
      }
      form.setValue('faqTitleEn', parsedTitle.en || '');
      form.setValue('faqTitleAr', parsedTitle.ar || '');
      form.setValue('faqDescriptionEn', parsedDescription.en || '');
      form.setValue('faqDescriptionAr', parsedDescription.ar || '');
    }
  }, [faqDetail, isEditing, faq, form]);

  const onSubmit = (values: FaqFormValues) => {
    setServerErrors({});
    const apiData = toApiFormat(values);

    const commonOptions = {
      onError: (error: unknown) => {
        const apiError = error as ApiErrorResponse;
        if (apiError?.status === 422 && apiError.errors) {
          setServerErrors(apiError.errors);
        }
      },
    };

    if (isEditing && faq) {
      updateMutation.mutate(
        { id: faq.id, data: apiData },
        { ...commonOptions, onSuccess }
      );
    } else {
      createMutation.mutate(apiData, { ...commonOptions, onSuccess });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isDetailLoading;
  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof FaqFormValues]?.message as string | undefined;
    const serverErr = serverErrors[field]?.[0]
      || serverErrors['faq_title.en']?.[0]
      || serverErrors['faq_title.ar']?.[0]
      || serverErrors['faq_description.en']?.[0]
      || serverErrors['faq_description.ar']?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('faqs.editFaq') : t('faqs.createFaq')}</DialogTitle>
          <DialogDescription>
            {t('faqs.subtitle')}
          </DialogDescription>
        </DialogHeader>

        {isDetailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="faqTitleEn" className="text-sm font-medium">{t('faqsForm.faqTitleEn')} *</label>
            <Input
              id="faqTitleEn"
              placeholder={t('faqsForm.faqTitleEn')}
              {...form.register('faqTitleEn')}
            />
            {getError('faqTitleEn') && (
              <p className="text-xs text-destructive">{getError('faqTitleEn')}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="faqTitleAr" className="text-sm font-medium">{t('faqsForm.faqTitleAr')} *</label>
            <Input
              id="faqTitleAr"
              placeholder={t('faqsForm.faqTitleAr')}
              {...form.register('faqTitleAr')}
            />
            {getError('faqTitleAr') && (
              <p className="text-xs text-destructive">{getError('faqTitleAr')}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="faqDescriptionEn" className="text-sm font-medium">{t('faqsForm.faqDescriptionEn')} *</label>
            <Textarea
              id="faqDescriptionEn"
              placeholder={t('faqsForm.faqDescriptionEn')}
              {...form.register('faqDescriptionEn')}
            />
            {getError('faqDescriptionEn') && (
              <p className="text-xs text-destructive">{getError('faqDescriptionEn')}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="faqDescriptionAr" className="text-sm font-medium">{t('faqsForm.faqDescriptionAr')} *</label>
            <Textarea
              id="faqDescriptionAr"
              placeholder={t('faqsForm.faqDescriptionAr')}
              {...form.register('faqDescriptionAr')}
            />
            {getError('faqDescriptionAr') && (
              <p className="text-xs text-destructive">{getError('faqDescriptionAr')}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isDetailLoading
                ? t('common.loading')
                : isPending
                  ? (isEditing ? t('faqs.updating') : t('faqs.creating'))
                  : (isEditing ? t('faqsForm.updateFaq') : t('faqsForm.createFaq'))}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
