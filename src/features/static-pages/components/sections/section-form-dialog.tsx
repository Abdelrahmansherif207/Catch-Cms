import { useState } from 'react';
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
import { LocalizedContentEditor } from '../content-editor/localized-content-editor';
import {
  sectionFormSchema,
  sectionFormDefaults,
  toCreateSectionPayload,
  toUpdateSectionPayload,
  type SectionFormValues,
} from '../../schemas/static-page.schema';
import { useCreateStaticPageSection, useUpdateStaticPageSection } from '../../hooks/use-static-pages';
import type { Language } from '@/shared/constants/api';
import type { JsonObject, LocaleMap, StaticPageSection } from '../../types/static-page.types';
import type { ApiErrorResponse } from '@/shared/api';

interface SectionFormDialogProps {
  slug: string;
  section?: StaticPageSection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function parseTitleMap(title: StaticPageSection['title'] | undefined): Record<Language, string> {
  const empty: Record<Language, string> = { en: '', ar: '' };
  if (!title) return empty;
  if (typeof title === 'string') {
    try {
      return { ...empty, ...(JSON.parse(title) as Partial<Record<Language, string>>) };
    } catch {
      return { ...empty, en: title, ar: title };
    }
  }
  return { ...empty, ...title };
}

// The dialog is keyed by section id + open state in the parent, so it
// remounts per open — state initializers below always reflect the latest
// section, avoiding setState-in-effect reset logic.
export function SectionFormDialog({
  slug,
  section,
  open,
  onOpenChange,
  onSuccess,
}: SectionFormDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!section;
  const createMutation = useCreateStaticPageSection(slug);
  const updateMutation = useUpdateStaticPageSection(slug);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [contentValidation, setContentValidation] = useState<Record<string, string[]>>({});
  const [content, setContent] = useState<LocaleMap<JsonObject>>(() => ({
    en: section?.content?.en ?? {},
    ar: section?.content?.ar ?? {},
  }));

  const initialTitle = parseTitleMap(section?.title);

  const form = useForm<SectionFormValues>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: section
      ? { titleEn: initialTitle.en, titleAr: initialTitle.ar }
      : sectionFormDefaults,
  });

  const handleContentChange = (next: LocaleMap<JsonObject>) => {
    setContent(next);
    setContentValidation({});
  };

  const onSubmit = (values: SectionFormValues) => {
    setServerErrors({});
    setContentValidation({});

    if (!isEditing) {
      const message = t('staticPages.validation.contentRequired');
      const missing: Record<string, string[]> = {};
      if (!content.en || Object.keys(content.en).length === 0) missing['content.en'] = [message];
      if (!content.ar || Object.keys(content.ar).length === 0) missing['content.ar'] = [message];
      if (Object.keys(missing).length > 0) {
        setContentValidation(missing);
        return;
      }
    }

    const commonOptions = {
      onError: (error: unknown) => {
        const apiError = error as ApiErrorResponse;
        if (apiError?.status === 422 && apiError.errors) {
          setServerErrors(apiError.errors);
        }
      },
    };

    if (isEditing && section) {
      const payload = toUpdateSectionPayload(values, content, section.content ?? {});
      updateMutation.mutate(
        { id: section.id, data: payload },
        { ...commonOptions, onSuccess }
      );
    } else {
      const payload = toCreateSectionPayload(values, content);
      createMutation.mutate(payload, { ...commonOptions, onSuccess });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof SectionFormValues]?.message;
    const serverErr =
      serverErrors[field]?.[0] ||
      serverErrors['title.en']?.[0] ||
      serverErrors['title.ar']?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  const contentErrors: Record<string, string[]> = { ...contentValidation };
  Object.entries(serverErrors).forEach(([field, messages]) => {
    if (field.startsWith('content')) contentErrors[field] = messages;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('staticPages.editSection') : t('staticPages.addSection')}
          </DialogTitle>
          <DialogDescription>{t('staticPages.sectionFormSubtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('staticPages.titleEn')} *</label>
              <Input placeholder={t('staticPages.titleEn')} {...form.register('titleEn')} />
              {getError('titleEn') && (
                <p className="text-xs text-destructive">{getError('titleEn')}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('staticPages.titleAr')} *</label>
              <Input placeholder={t('staticPages.titleAr')} dir="rtl" {...form.register('titleAr')} />
              {getError('titleAr') && (
                <p className="text-xs text-destructive">{getError('titleAr')}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('staticPages.content')}</label>
            <LocalizedContentEditor
              value={content}
              onChange={handleContentChange}
              errors={contentErrors}
            />
            <p className="text-xs text-muted-foreground">{t('staticPages.contentHint')}</p>
          </div>

          {Object.keys(contentErrors).length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(contentErrors).map(([field, messages]) =>
                  messages.map((msg, i) => (
                    <li key={`${field}-${i}`} className="text-xs text-destructive">
                      {msg}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {isEditing ? t('staticPages.updating') : t('staticPages.creating')}
                </>
              ) : isEditing ? (
                t('staticPages.updateSection')
              ) : (
                t('staticPages.addSection')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}