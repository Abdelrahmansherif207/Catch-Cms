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
import { defaultFrontSettingsForType } from '../lib/section-settings';
import {
  sectionEditFormSchema,
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

/** API flags can be booleans, 0/1 numbers, or "0"/"1" strings. */
function toFlag(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
}

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
    // Edit mode allows an empty title (some stored sections have a null one).
    resolver: zodResolver(
      isEditing ? sectionEditFormSchema : sectionFormSchema
    ) as unknown as Resolver<SectionFormValues>,
    defaultValues: section
      ? {
          ...sectionFormDefaults,
          type: section.type,
          titleEn: titleDraft.en,
          titleAr: titleDraft.ar,
          isActive: toFlag(section.is_active, true),
          titleVisible: toFlag(section.title_visible, true),
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

  // Non-blocking Arabic title warnings: empty while the English title has
  // content, or byte-identical to it. The create schema still requires both.
  const titleArValue = form.watch('titleAr');
  const titleEnValue = form.watch('titleEn');
  const titleArTrim = (titleArValue ?? '').trim();
  const titleEnTrim = (titleEnValue ?? '').trim();
  const titleArWarning =
    titleEnTrim && !titleArTrim
      ? t('sections.arabicEmptyWarning')
      : titleEnTrim && titleArTrim && titleEnTrim === titleArTrim
        ? t('sections.arabicSameWarning')
        : null;

  // ─── Handlers ────────────────────────────────────────────────

  const handleTypeChange = useCallback(
    (newType: string | null) => {
      if (!newType) return;
      form.setValue('type', newType, { shouldDirty: true });
      setFrontSettings(defaultFrontSettingsForType(newType));
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
        {
          ...commonOptions,
          // The edit page keeps the user here after a save: clear the dirty
          // state so the unsaved-changes guard doesn't block leaving.
          onSuccess: () => {
            setSettingsTouched(false);
            form.reset({ ...form.getValues() });
            onSuccess();
          },
        }
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
          {/* ─── Settings tabs (General holds the section-level controls) ─── */}
          {selectedType && (
            <DynamicSettingsForm
              key={selectedType}
              sectionType={selectedType}
              frontSettings={frontSettings}
              backSettings={backSettings}
              productType={productType}
              savedEndpoint={section?.endpoint ?? null}
              onFrontChange={handleFrontChange}
              onBackChange={handleBackChange}
              onProductTypeChange={handleProductTypeChange}
              generalSlot={
                <>
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
                        {t('sections.titleEn')}
                        {!isEditing && ' *'}
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
                        {t('sections.titleAr')}
                        {!isEditing && ' *'}
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
                      {titleArWarning && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          {titleArWarning}
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
                </>
              }
            />
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
