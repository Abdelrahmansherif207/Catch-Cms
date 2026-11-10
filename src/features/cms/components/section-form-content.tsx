import { useCallback, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { PageBackHeader } from '@/shared/components/page-header';
import { useUnsavedGuard } from '@/shared/hooks/use-unsaved-guard';
import { DynamicSettingsForm } from './dynamic-settings-form';
import { SectionTypeSelector } from './section-type-selector';
import { SectionTypeConfig } from './section-type-config';
import {
  sectionFormSchema,
  sectionFormDefaults,
  isPlainTitle,
  toCreatePayload,
  toTitleDraft,
  toUpdatePayload,
  type SectionFormValues,
} from '../schemas/section.schema';
import {
  useCreateSection,
  useUpdateSection,
  useSectionTypes,
} from '../hooks/use-sections';
import type { Section } from '../types/section.types';
import type { ApiErrorResponse } from '@/shared/api';

interface SectionFormContentProps {
  /** Existing section (edit mode) or undefined (create mode). */
  section?: Section;
  onSuccess: () => void;
  onCancel: () => void;
}

// ─── Initial values ─────────────────────────────────────────────

function initialSettings(section?: Section) {
  const front = section?.setting?.front ?? {};
  const back: Record<string, unknown> = { ...(section?.setting?.back ?? {}) };
  let productType: string | null = null;

  // Product template lives in `back.type` but is edited by its own selector.
  if (section?.type === 'products' && typeof back.type === 'string') {
    productType = back.type;
    delete back.type;
  }

  return { front, back, productType };
}

// ─── Component ──────────────────────────────────────────────────

export function SectionFormContent({
  section,
  onSuccess,
  onCancel,
}: SectionFormContentProps) {
  const { t } = useTranslation();
  const isEditing = !!section;

  const [initial] = useState(() => initialSettings(section));
  const [frontSettings, setFrontSettings] = useState<Record<string, unknown>>(initial.front);
  const [backSettings, setBackSettings] = useState<Record<string, unknown>>(initial.back);
  const [productType, setProductType] = useState<string | null>(initial.productType);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  // Settings aren't part of react-hook-form, so track their edits separately.
  const [settingsTouched, setSettingsTouched] = useState(false);

  const createMutation = useCreateSection();
  const updateMutation = useUpdateSection();
  const { data: sectionTypesData } = useSectionTypes();
  const sectionTypes = sectionTypesData?.data || [];

  const titleDraft = toTitleDraft(section?.title);

  const form = useForm<SectionFormValues>({
    resolver: zodResolver(sectionFormSchema) as unknown as Resolver<SectionFormValues>,
    defaultValues: section
      ? {
          ...sectionFormDefaults,
          type: section.type,
          titleEn: titleDraft.en,
          titleAr: titleDraft.ar,
          isActive: section.is_active,
          titleVisible: section.title_visible ?? true,
        }
      : sectionFormDefaults,
  });

  const selectedType = form.watch('type');
  const isDirty = form.formState.isDirty || settingsTouched;
  const { confirmLeave } = useUnsavedGuard(isDirty);
  // A plain-string title holds only the resolved locale, so once the user
  // edits one input the untouched one still shows that same string; a hint on
  // the untouched input explains that its stored translation is preserved.
  const loadedTitleIsPlain = isPlainTitle(section?.title);
  const titleEnDirty = !!form.formState.dirtyFields.titleEn;
  const titleArDirty = !!form.formState.dirtyFields.titleAr;

  // ─── Handlers ────────────────────────────────────────────────

  const handleTypeChange = useCallback(
    (newType: string | null) => {
      if (!newType) return;
      form.setValue('type', newType, { shouldDirty: true });
      setFrontSettings({});
      setBackSettings({});
      setProductType(null);
      setSettingsTouched(true);
    },
    [form]
  );

  const handleFrontChange = useCallback((settings: Record<string, unknown>) => {
    setFrontSettings(settings);
    setSettingsTouched(true);
  }, []);

  const handleBackChange = useCallback((settings: Record<string, unknown>) => {
    setBackSettings(settings);
    setSettingsTouched(true);
  }, []);

  const handleProductTypeChange = useCallback((type: string | null) => {
    setProductType(type);
    setSettingsTouched(true);
  }, []);

  const handleCancel = useCallback(() => {
    if (confirmLeave()) onCancel();
  }, [confirmLeave, onCancel]);

  const onSubmit = (values: SectionFormValues) => {
    setServerErrors({});

    // Merge dynamic settings into form values
    const merged: SectionFormValues = {
      ...values,
      frontSettings,
      backSettings,
      productType,
    };

    const commonOptions = {
      onError: (error: unknown) => {
        const apiError = error as ApiErrorResponse;
        if (apiError?.status === 422 && apiError.errors) {
          setServerErrors(apiError.errors);
        }
      },
    };

    if (isEditing && section) {
      // A plain-string title is only the resolved current locale, so writing
      // both fields would copy it over the other locale. Send only the
      // locales the user touched; the API merges `title` per locale.
      const dirty = form.formState.dirtyFields;
      const changedLocales: { en?: string; ar?: string } = {};
      if (dirty.titleEn) changedLocales.en = merged.titleEn;
      if (dirty.titleAr) changedLocales.ar = merged.titleAr;

      updateMutation.mutate(
        { id: section.id, data: toUpdatePayload(merged, changedLocales) },
        { ...commonOptions, onSuccess }
      );
    } else {
      createMutation.mutate(toCreatePayload(merged), { ...commonOptions, onSuccess });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof SectionFormValues]?.message as string | undefined;
    const serverErr = serverErrors[field]?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  return (
    <div className="space-y-6">
      <PageBackHeader
        title={isEditing ? t('sections.editSection') : t('sections.createSection')}
        description={t('sections.formSubtitle')}
        backTo="/cms"
        onBack={confirmLeave}
      />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="space-y-5 rounded-2xl border bg-card p-4 shadow-card sm:p-6">
          {/* ─── Type ─── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('sections.sectionType')} *</label>
            <SectionTypeSelector
              types={sectionTypes}
              value={selectedType}
              onChange={handleTypeChange}
              disabled={isEditing}
            />
            {getError('type') && (
              <p className="text-xs text-destructive">{getError('type')}</p>
            )}
          </div>

          {/* ─── Titles ─── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="titleEn" className="text-sm font-medium">
                {t('sections.titleEn')} *
              </label>
              <Input
                id="titleEn"
                placeholder="e.g. Flash Sales"
                {...form.register('titleEn')}
              />
              {getError('titleEn') && (
                <p className="text-xs text-destructive">{getError('titleEn')}</p>
              )}
              {loadedTitleIsPlain && !titleEnDirty && titleArDirty && (
                <p className="text-xs text-muted-foreground">
                  {t('sections.untouchedLocaleHint')}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="titleAr" className="text-sm font-medium">
                {t('sections.titleAr')} *
              </label>
              <Input
                id="titleAr"
                dir="rtl"
                placeholder="مثال: العروض"
                {...form.register('titleAr')}
              />
              {getError('titleAr') && (
                <p className="text-xs text-destructive">{getError('titleAr')}</p>
              )}
              {loadedTitleIsPlain && !titleArDirty && titleEnDirty && (
                <p className="text-xs text-muted-foreground">
                  {t('sections.untouchedLocaleHint')}
                </p>
              )}
            </div>
          </div>

          {/* ─── Toggles ─── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <label className="text-sm font-medium">{t('sections.isActive')}</label>
              <button
                type="button"
                role="switch"
                aria-checked={form.watch('isActive')}
                aria-label={t('sections.isActive')}
                onClick={() => form.setValue('isActive', !form.getValues('isActive'), { shouldDirty: true })}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors ${
                  form.watch('isActive') ? 'bg-primary' : 'bg-input'
                }`}
              >
                <span
                  className={`pointer-events-none absolute start-0.5 top-0.5 block h-4 w-4 rounded-full bg-background shadow-sm transition-[inset-inline-start] ${
                    form.watch('isActive') ? 'start-[18px]' : ''
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <label className="text-sm font-medium">{t('sections.titleVisible')}</label>
              <button
                type="button"
                role="switch"
                aria-checked={form.watch('titleVisible')}
                aria-label={t('sections.titleVisible')}
                onClick={() => form.setValue('titleVisible', !form.getValues('titleVisible'), { shouldDirty: true })}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors ${
                  form.watch('titleVisible') ? 'bg-primary' : 'bg-input'
                }`}
              >
                <span
                  className={`pointer-events-none absolute start-0.5 top-0.5 block h-4 w-4 rounded-full bg-background shadow-sm transition-[inset-inline-start] ${
                    form.watch('titleVisible') ? 'start-[18px]' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ─── Inline Type Config ─── */}
          {selectedType && (
            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="text-sm font-semibold">{t('sections.typeConfig')}</h3>
              <SectionTypeConfig
                type={selectedType}
                frontSettings={frontSettings}
                onFrontChange={handleFrontChange}
              />
            </div>
          )}

          {/* ─── Dynamic Settings ─── */}
          {selectedType && (
            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="text-sm font-semibold">{t('sections.advancedSettings')}</h3>
              <DynamicSettingsForm
                sectionType={selectedType}
                frontSettings={frontSettings}
                backSettings={backSettings}
                productType={productType}
                onFrontChange={handleFrontChange}
                onBackChange={handleBackChange}
                onProductTypeChange={handleProductTypeChange}
              />
            </div>
          )}

          {/* ─── Server Errors ─── */}
          {Object.keys(serverErrors).length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <ul className="list-inside list-disc space-y-1">
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
        </div>

        {/* ─── Sticky Actions ─── */}
        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 rounded-2xl border bg-card/95 p-3 shadow-lg backdrop-blur">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {isEditing ? t('sections.updating') : t('sections.creating')}
              </>
            ) : isEditing ? (
              t('sections.updateSection')
            ) : (
              t('sections.createSection')
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
