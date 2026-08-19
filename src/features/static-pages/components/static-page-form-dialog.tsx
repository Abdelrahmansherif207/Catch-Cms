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
import { Switch } from '@/shared/ui/switch';
import { useStaticPage, useUpdateStaticPage } from '../hooks/use-static-pages';
import {
  staticPageFormSchema,
  staticPageFormDefaults,
  toUpdatePagePayload,
  type StaticPageFormValues,
} from '../schemas/static-page.schema';
import type { LocaleMap, StaticPage } from '../types/static-page.types';
import type { ApiErrorResponse } from '@/shared/api';

interface StaticPageFormDialogProps {
  page: StaticPage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function parseTitleMap(title: StaticPage['title'] | undefined): LocaleMap<string> {
  if (!title) return {};
  if (typeof title === 'string') {
    try {
      return JSON.parse(title) as LocaleMap<string>;
    } catch {
      return { en: title, ar: title };
    }
  }
  return title;
}

export function StaticPageFormDialog({
  page,
  open,
  onOpenChange,
  onSuccess,
}: StaticPageFormDialogProps) {
  const { t } = useTranslation();
  const updateMutation = useUpdateStaticPage();
  const { data: pageDetail, isLoading: isDetailLoading } = useStaticPage(page?.slug ?? '');
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const form = useForm<StaticPageFormValues>({
    resolver: zodResolver(staticPageFormSchema),
    defaultValues: staticPageFormDefaults,
  });

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setServerErrors({});
      form.reset(staticPageFormDefaults);
    }
    prevOpenRef.current = open;
  }, [open, form]);

  useEffect(() => {
    if (open && page && pageDetail?.data) {
      const title = parseTitleMap(pageDetail.data.title);
      form.setValue('titleEn', title.en || '');
      form.setValue('titleAr', title.ar || '');
      form.setValue('isActive', pageDetail.data.is_active);
    }
  }, [open, page, pageDetail, form]);

  const originalTitle = pageDetail?.data ? parseTitleMap(pageDetail.data.title) : {};

  const onSubmit = (values: StaticPageFormValues) => {
    if (!page) return;
    setServerErrors({});
    const payload = toUpdatePagePayload(values, originalTitle);

    updateMutation.mutate(
      { slug: page.slug, data: payload },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess();
        },
        onError: (error: unknown) => {
          const apiError = error as ApiErrorResponse;
          if (apiError?.status === 422 && apiError.errors) {
            setServerErrors(apiError.errors);
          }
        },
      }
    );
  };

  const isPending = updateMutation.isPending || isDetailLoading;
  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof StaticPageFormValues]?.message;
    const serverErr =
      serverErrors[field]?.[0] ||
      serverErrors['title.en']?.[0] ||
      serverErrors['title.ar']?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{t('staticPages.editPage')}</DialogTitle>
          <DialogDescription>{t('staticPages.editPageSubtitle')}</DialogDescription>
        </DialogHeader>

        {isDetailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('staticPages.slug')}</label>
              <Input value={page?.slug ? `/${page.slug}` : ''} disabled className="font-mono" />
              <p className="text-xs text-muted-foreground">{t('staticPages.slugImmutable')}</p>
            </div>

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

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <label className="text-sm font-medium">{t('staticPages.isActive')}</label>
                <p className="text-xs text-muted-foreground">{t('staticPages.isActiveHint')}</p>
              </div>
              <Switch
                checked={form.watch('isActive')}
                onCheckedChange={(checked) => form.setValue('isActive', !!checked)}
              />
            </div>

            {Object.keys(serverErrors).length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <ul className="list-disc list-inside space-y-1">
                  {Object.entries(serverErrors).map(([field, messages]) =>
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
                    {t('staticPages.saving')}
                  </>
                ) : (
                  t('common.save')
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}