import { useEffect, useRef, useState, useCallback } from 'react';
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
import { DynamicSettingsForm } from './dynamic-settings-form';
import { SectionTypeSelector } from './section-type-selector';
import { SectionTypeConfig } from './section-type-config';
import {
  sectionFormSchema,
  sectionFormDefaults,
  toCreatePayload,
  toUpdatePayload,
  type SectionFormValues,
} from '../schemas/section.schema';
import {
  useCreateSection,
  useUpdateSection,
  useSection,
  useSectionTypes,
} from '../hooks/use-sections';
import type { Section } from '../types/section.types';
import type { ApiErrorResponse } from '@/shared/api';

interface SectionFormDialogProps {
  section?: Section | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SectionFormDialog({
  section,
  open,
  onOpenChange,
  onSuccess,
}: SectionFormDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!section;
  const createMutation = useCreateSection();
  const updateMutation = useUpdateSection();
  const { data: sectionDetail, isLoading: isDetailLoading } = useSection(section?.id ?? 0);
  const { data: sectionTypesData } = useSectionTypes();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  // Dynamic settings state (managed outside react-hook-form for flexibility)
  const [frontSettings, setFrontSettings] = useState<Record<string, unknown>>({});
  const [backSettings, setBackSettings] = useState<Record<string, unknown>>({});
  const [productType, setProductType] = useState<string | null>(null);

  const configRef = useRef<HTMLDivElement>(null);
  const sectionTypes = sectionTypesData?.data || [];

  const form = useForm<SectionFormValues>({
    resolver: zodResolver(sectionFormSchema) as any,
    defaultValues: sectionFormDefaults,
  });

  const selectedType = form.watch('type');

  // ─── Reset on open ────────────────────────────────────────────

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setServerErrors({});
      setFrontSettings({});
      setBackSettings({});
      setProductType(null);
      form.reset(sectionFormDefaults);
    }
    prevOpenRef.current = open;
  }, [open, form]);

  // ─── Populate on edit ─────────────────────────────────────────

  useEffect(() => {
    if (isEditing && section && sectionDetail?.data) {
      const d = sectionDetail.data;

      form.setValue('type', d.type);
      form.setValue('isActive', d.is_active);

      // Parse title — may be string or object
      let parsedTitle: Record<string, string> = {};
      try {
        parsedTitle = typeof d.title === 'string' ? JSON.parse(d.title) : { en: d.title, ar: d.title };
      } catch {
        parsedTitle = { en: d.title || '', ar: d.title || '' };
      }
      form.setValue('titleEn', parsedTitle.en || d.title || '');
      form.setValue('titleAr', parsedTitle.ar || d.title || '');

      // Settings
      if (d.setting) {
        setFrontSettings(d.setting.front || {});
        const back = { ...(d.setting.back || {}) };

        // Extract product type from back.type
        if (d.type === 'products' && back.type) {
          setProductType(back.type as string);
          delete back.type;
        }
        setBackSettings(back);
      }
    }
  }, [sectionDetail, isEditing, section, form]);

  // ─── Auto-scroll to config on type change ─────────────────────
  useEffect(() => {
    if (selectedType && configRef.current) {
      configRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedType]);

  // ─── Type change handler — reset settings ─────────────────────

  const handleTypeChange = useCallback(
    (newType: string | null) => {
      if (!newType) return;
      form.setValue('type', newType);
      setFrontSettings({});
      setBackSettings({});
      setProductType(null);
    },
    [form]
  );

  // ─── Submit ────────────────────────────────────────────────────

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
      const payload = toUpdatePayload(merged);
      updateMutation.mutate(
        { id: section.id, data: payload },
        { ...commonOptions, onSuccess }
      );
    } else {
      const payload = toCreatePayload(merged);
      createMutation.mutate(payload, { ...commonOptions, onSuccess });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isDetailLoading;
  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof SectionFormValues]?.message as string | undefined;
    const serverErr = serverErrors[field]?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('sections.editSection') : t('sections.createSection')}
          </DialogTitle>
          <DialogDescription>
            {t('sections.formSubtitle')}
          </DialogDescription>
        </DialogHeader>

        {isDetailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4" noValidate>
            {/* ─── Type ─── */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t('sections.sectionType')} *
              </label>
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

            {/* ─── Title EN ─── */}
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
              </div>

              {/* ─── Title AR ─── */}
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
                  onClick={() => form.setValue('isActive', !form.getValues('isActive'))}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                    form.watch('isActive') ? 'bg-primary' : 'bg-input'
                  }`}
                >
                  <span
                    className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${
                      form.watch('isActive') ? 'translate-x-4' : 'translate-x-0.5'
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
                  onClick={() => form.setValue('titleVisible', !form.getValues('titleVisible'))}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                    form.watch('titleVisible') ? 'bg-primary' : 'bg-input'
                  }`}
                >
                  <span
                    className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${
                      form.watch('titleVisible') ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* ─── Inline Type Config ─── */}
            {selectedType && (
              <div ref={configRef} className="rounded-lg border p-4 space-y-3 scroll-mt-4">
                <h3 className="text-sm font-semibold">{t('sections.typeConfig')}</h3>
                <SectionTypeConfig
                  type={selectedType}
                  frontSettings={frontSettings}
                  onFrontChange={setFrontSettings}
                />
              </div>
            )}

            {/* ─── Dynamic Settings ─── */}
            {selectedType && (
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="text-sm font-semibold">{t('sections.advancedSettings')}</h3>
                <DynamicSettingsForm
                  sectionType={selectedType}
                  frontSettings={frontSettings}
                  backSettings={backSettings}
                  productType={productType}
                  onFrontChange={setFrontSettings}
                  onBackChange={setBackSettings}
                  onProductTypeChange={setProductType}
                />
              </div>
            )}

            {/* ─── Server Errors ─── */}
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
                    {isEditing ? t('sections.updating') : t('sections.creating')}
                  </>
                ) : isEditing ? (
                  t('sections.updateSection')
                ) : (
                  t('sections.createSection')
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
