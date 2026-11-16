import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { useTypeSettings, useProductTypes } from '../hooks/use-sections';
import { ProductTypeResponseError } from '../api/sections.api';
import {
  mergeSettingsFields,
  toLocalizedDraft,
  type FieldGroup,
  type SettingsFieldSpec,
} from '../lib/section-settings';
import { sectionTypeImage } from '../lib/section-type-images';
import { buildSectionEndpoint } from '../lib/section-preview';
import {
  buildProductTemplateOptions,
  cleanPresetBack,
  ignoredPresetKeys,
  PRODUCTS_PRESET_IGNORED_KEYS,
  type ProductsDataMode,
} from '../lib/product-templates';
import { ProductsTemplatePicker } from './products-template-picker';
import { SettingsField, toEffectiveBoolean } from './section-settings-field';
import { SectionEndpointPreview } from './section-endpoint-preview';
import { HeroMediaPicker } from './hero-media-picker';
import { SectionTypeConfig } from './section-type-config';

// ─── Inline & hidden key bookkeeping ─────────────────────────────

// Front-settings keys rendered by another control, filtered out of the merged
// settings list so the same setting is not edited in two places.
// `SectionTypeConfig` handles categories `shape` (Layout tab); HeroMediaPicker
// handles the hero media paths (Media tab). Keep in sync with those components.
const INLINE_FRONT_KEYS: Record<string, string[]> = {
  categories: ['shape'],
  hero: ['video_desktop', 'video_mobile', 'poster', 'image_desktop', 'image_mobile'],
};

// Storefront no-ops: these keys are not consumed by the matching component.
// Hiding them keeps the edit form free of inputs that cannot change anything,
// while the saved record is still sent back untouched (nothing is deleted).
const HIDDEN_FRONT_KEYS: Record<string, string[]> = {
  categories: ['balance_last_row'],
  coupons: ['columns_count', 'layout'],
  promotions: ['columns_count', 'layout', 'autoplay', 'slider_speed'],
  'flash-sales': ['autoplay', 'slider_speed', 'theme'],
};

// Back-settings keys that are redundant with a dedicated control.
const HIDDEN_BACK_KEYS: Record<string, string[]> = {
  // parent_only was a no-op for the categories query — removed from the form
  // in the settings rework. Hidden, never deleted: saved values are still
  // sent back untouched.
  categories: ['parent_only'],
  hero: ['slug'],
};

// Backend no-op for every type: `order_price` is documented but never consumed
// by any storefront component or query. Hidden from the form for all types;
// new sections never get it written and saved values are never deleted.
const GLOBALLY_HIDDEN_BACK_KEYS = ['order_price'];

// ─── Visibility rules ────────────────────────────────────────────

// Fields shown only while their controlling toggle is on. Unset toggles fall
// back to the storefront's effective default (show_view_all / show_cta default
// to on, show_timer to off).
const VISIBILITY_RULES: Record<string, (values: Record<string, unknown>) => boolean> = {
  timer_end_at: (values) => toEffectiveBoolean(values.show_timer, false),
  action_label: (values) => toEffectiveBoolean(values.show_view_all, true),
  action_href: (values) => toEffectiveBoolean(values.show_view_all, true),
  cta_label: (values) => toEffectiveBoolean(values.show_cta, true),
  cta_href: (values) => toEffectiveBoolean(values.show_cta, true),
};

function isFieldVisible(spec: SettingsFieldSpec, values: Record<string, unknown>): boolean {
  return VISIBILITY_RULES[spec.key]?.(values) ?? true;
}

// ─── Props ───────────────────────────────────────────────────────

interface DynamicSettingsFormProps {
  sectionType: string;
  frontSettings: Record<string, unknown>;
  backSettings: Record<string, unknown>;
  productType: string | null;
  onFrontChange: (settings: Record<string, unknown>) => void;
  onBackChange: (settings: Record<string, unknown>) => void;
  onProductTypeChange: (type: string | null) => void;
  /**
   * Saved `endpoint` of an existing section — the backend-generated path the
   * preview reuses instead of guessing the storefront path.
   */
  savedEndpoint?: string | null;
  /**
   * Section-level controls (type selector, titles, active/title-visible
   * toggles) rendered inside the General tab above the general settings.
   */
  generalSlot?: ReactNode;
}

// ─── Component ───────────────────────────────────────────────────

export function DynamicSettingsForm({
  sectionType,
  frontSettings,
  backSettings,
  productType,
  onFrontChange,
  onBackChange,
  onProductTypeChange,
  savedEndpoint,
  generalSlot,
}: DynamicSettingsFormProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('general');
  const { data: typeSettingsData, isLoading: isLoadingSettings } = useTypeSettings(sectionType);
  const {
    data: productTypes = [],
    isLoading: isLoadingProductTypes,
    isError: isProductTypesError,
    error: productTypesError,
    refetch: refetchProductTypes,
  } = useProductTypes();

  const isProductsType = sectionType === 'products';

  // Preset (template chosen) vs Custom (filters only). Derived from the saved
  // `back.type`; `presetIntent` keeps the editor in Preset between the
  // confirmed switch and the moment a template is picked. The form is
  // remounted per section type (key={selectedType}), so no sync effect is
  // needed and a stale intent can never leak across types.
  const [presetIntent, setPresetIntent] = useState(false);
  const [pendingMode, setPendingMode] = useState<ProductsDataMode | null>(null);
  const mode: ProductsDataMode = productType || presetIntent ? 'preset' : 'custom';
  const templateOptions = useMemo(
    () => buildProductTemplateOptions(productTypes),
    [productTypes]
  );

  if (!sectionType) return null;

  // While the template loads only the General tab is known; keep the
  // section-level controls visible and spin for the rest.
  if (isLoadingSettings) {
    return (
      <div className="space-y-5">
        <Tabs value="general">
          <TabsList>
            <TabsTrigger value="general">{t('sections.tabGroupGeneral')}</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="mt-4 space-y-5">
            {generalSlot}
          </TabsContent>
        </Tabs>
        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
          <Loader2 className="me-2 h-4 w-4 animate-spin" />
          {t('sections.loadingSettings')}
        </div>
      </div>
    );
  }

  const frontTemplate = typeSettingsData?.data?.front || {};
  const backTemplate = typeSettingsData?.data?.back || {};

  const hiddenFrontKey = (key: string) =>
    (HIDDEN_FRONT_KEYS[sectionType] ?? []).includes(key);

  const hiddenBackKey = (key: string) => {
    if (GLOBALLY_HIDDEN_BACK_KEYS.includes(key)) return true;
    if ((HIDDEN_BACK_KEYS[sectionType] ?? []).includes(key)) return true;
    if (isProductsType) {
      // `type` is edited by the Preset/Custom mode switch.
      if (key === 'type') return true;
      // Preset: the template decides everything except the row Limit.
      // Custom: filters, order and limit are all offered.
      if (mode === 'preset' && key !== 'limit') return true;
    }
    return false;
  };

  const handleFrontFieldChange = (key: string, value: unknown) => {
    onFrontChange({ ...frontSettings, [key]: value });
  };

  // Multi-key fill used by the hero media picker (media_type + paths at once).
  const handleFrontPatch = (patch: Record<string, unknown>) => {
    onFrontChange({ ...frontSettings, ...patch });
  };

  const handleBackFieldChange = (key: string, value: unknown) => {
    onBackChange({ ...backSettings, [key]: value });
  };

  // ─── Products Preset/Custom mode switching ─────────────────────

  const applyMode = (next: ProductsDataMode) => {
    // Both confirmed switches drop the keys the target mode ignores — going
    // to Preset removes leftover filters/order/order_price, going to Custom
    // removes them too (Custom starts with empty filters) and clears the
    // template. Plain saves never call this: saved records stay untouched.
    onBackChange(cleanPresetBack(backSettings));
    if (next === 'preset') {
      setPresetIntent(true);
    } else {
      onProductTypeChange(null);
      setPresetIntent(false);
    }
    setPendingMode(null);
  };

  const requestMode = (next: ProductsDataMode) => {
    if (next === mode) return;
    const ignored = ignoredPresetKeys(backSettings);
    const wouldClear =
      next === 'preset' ? ignored.length > 0 : !!productType || ignored.length > 0;
    if (wouldClear) setPendingMode(next);
    else applyMode(next);
  };

  // Declared fields (template + registry) plus the safety net: keys that only
  // exist in the section's saved data — they can never be invisible.
  const frontMerged = mergeSettingsFields(sectionType, 'front', frontTemplate, frontSettings, {
    inlineKeys: INLINE_FRONT_KEYS[sectionType] || [],
    hiddenPredicate: hiddenFrontKey,
  });
  const backMerged = mergeSettingsFields(sectionType, 'back', backTemplate, backSettings, {
    hiddenPredicate: hiddenBackKey,
  });

  // Partition declared fields by their resolved editor tab.
  const frontGeneral = frontMerged.fields.filter(
    (f) => f.group === 'general' && isFieldVisible(f, frontSettings)
  );
  const frontLayout = frontMerged.fields.filter(
    (f) => f.group === 'layout' && isFieldVisible(f, frontSettings)
  );
  const frontMedia = frontMerged.fields.filter(
    (f) => f.group === 'media' && isFieldVisible(f, frontSettings)
  );
  const frontExtras = frontMerged.fields.filter(
    (f) => f.group === 'extras' && isFieldVisible(f, frontSettings)
  );
  const backContent = backMerged.fields.filter(
    (f) => f.group === 'content' && isFieldVisible(f, backSettings)
  );
  const advancedFront = frontMerged.fields.filter((f) => f.group === 'advanced');
  const advancedBack = backMerged.fields.filter((f) => f.group === 'advanced');

  // Safety net: saved-data keys nobody declared → read-only Other Settings.
  const allUnknown: UnknownKeyEntry[] = [
    ...frontMerged.extra.map((spec) => ({ side: 'front' as const, spec })),
    ...backMerged.extra.map((spec) => ({ side: 'back' as const, spec })),
  ];
  // A Preset section shows its inert leftovers (filters/order/order_price) in
  // the dedicated "Ignored settings" list instead; the custom-mode marker
  // `type: null` is never listed anywhere.
  const ignoredEntries =
    isProductsType && mode === 'preset'
      ? allUnknown.filter((entry) => PRODUCTS_PRESET_IGNORED_KEYS.includes(entry.spec.key))
      : [];
  const unknownKeys = allUnknown.filter(
    (entry) => !ignoredEntries.includes(entry) && !(isProductsType && entry.spec.key === 'type')
  );

  const isHero = sectionType === 'hero';
  const hasShapePreview = sectionType === 'categories';
  const hasTypePreview = !!sectionTypeImage(sectionType);

  // Live endpoint preview: types with back (query) settings only — the hero
  // has none, so it gets no Content tab preview at all.
  const showEndpointPreview = isProductsType || backContent.length > 0;
  const previewEndpoint = showEndpointPreview
    ? buildSectionEndpoint(sectionType, backSettings, productType, savedEndpoint)
    : '';

  // Non-blocking Arabic warnings for the localized subtitle (title warnings
  // live next to the title inputs in the General slot).
  const subtitleWarning = (() => {
    if (!frontGeneral.some((field) => field.key === 'subtitle')) return null;
    const draft = toLocalizedDraft(frontSettings.subtitle);
    const en = draft.en.trim();
    const ar = draft.ar.trim();
    if (en && !ar) return t('sections.arabicEmptyWarning');
    if (en && ar && en === ar) return t('sections.arabicSameWarning');
    return null;
  })();

  const visibleGroups = new Set<FieldGroup>(['general']);
  if (backContent.length > 0 || isProductsType) visibleGroups.add('content');
  if (frontLayout.length > 0 || hasShapePreview || hasTypePreview) visibleGroups.add('layout');
  if (isHero) visibleGroups.add('media');
  if (frontExtras.length > 0) visibleGroups.add('extras');
  if (advancedFront.length > 0 || advancedBack.length > 0 || unknownKeys.length > 0 || ignoredEntries.length > 0) {
    visibleGroups.add('advanced');
  }

  // A hidden group can be the active one (e.g. the user turned off the last
  // toggle that made it visible) — fall back to General in that case.
  const resolvedTab = visibleGroups.has(activeTab as FieldGroup) ? activeTab : 'general';

  const productsModePanel = isProductsType ? (
    <div className="space-y-4">
      {/* ─── Preset | Custom switch (replaces the plain template dropdown) ─── */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t('sections.productsDataMode')}</label>
        <div className="inline-flex rounded-lg border bg-muted p-0.5">
          {(['preset', 'custom'] as ProductsDataMode[]).map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={mode === id}
              onClick={() => requestMode(id)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                mode === id
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {id === 'preset' ? t('sections.modePreset') : t('sections.modeCustom')}
            </button>
          ))}
        </div>
      </div>

      {mode === 'preset' ? (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t('sections.productTemplate')}</label>
          {isLoadingProductTypes ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.loading')}
            </div>
          ) : isProductTypesError ? (
            <div
              role="alert"
              className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              <span>
                {productTypesError instanceof ProductTypeResponseError
                  ? t('sections.productTypesMalformed')
                  : t('sections.productTypesLoadError')}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetchProductTypes()}
              >
                <RefreshCw className="h-4 w-4" />
                {t('common.retry')}
              </Button>
            </div>
          ) : (
            <>
              <ProductsTemplatePicker
                options={templateOptions}
                value={productType}
                onChange={(value) => {
                  onProductTypeChange(value);
                  setPresetIntent(false);
                }}
                placeholder={t('sections.selectProductTemplate')}
              />
              {productTypes.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('sections.productTypesEmpty')}
                </p>
              )}
            </>
          )}
          {!productType && !isLoadingProductTypes && !isProductTypesError && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {t('sections.productsPresetNoTemplate')}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t('sections.productsCustomHint')}
        </p>
      )}
    </div>
  ) : null;

  return (
    <>
      <Tabs value={resolvedTab} onValueChange={(v) => setActiveTab(String(v))}>
        <TabsList className="flex-wrap">
        <TabsTrigger value="general">{t('sections.tabGroupGeneral')}</TabsTrigger>
        {visibleGroups.has('content') && (
          <TabsTrigger value="content">{t('sections.tabGroupContent')}</TabsTrigger>
        )}
        {visibleGroups.has('layout') && (
          <TabsTrigger value="layout">{t('sections.tabGroupLayout')}</TabsTrigger>
        )}
        {visibleGroups.has('media') && (
          <TabsTrigger value="media">{t('sections.tabGroupMedia')}</TabsTrigger>
        )}
        {visibleGroups.has('extras') && (
          <TabsTrigger value="extras">{t('sections.tabGroupExtras')}</TabsTrigger>
        )}
        {visibleGroups.has('advanced') && (
          <TabsTrigger value="advanced">{t('sections.tabGroupAdvanced')}</TabsTrigger>
        )}
      </TabsList>

      {/* ─── General: section identity + copy ─── */}
      <TabsContent value="general" className="mt-4 space-y-5">
        {generalSlot}
        <FieldGrid
          fields={frontGeneral}
          values={frontSettings}
          onChange={handleFrontFieldChange}
          sectionType={sectionType}
        />
        {subtitleWarning && (
          <p className="text-xs text-amber-600 dark:text-amber-400">{subtitleWarning}</p>
        )}
      </TabsContent>

      {/* ─── Content: back (query) settings ─── */}
      {visibleGroups.has('content') && (
        <TabsContent value="content" className="mt-4 space-y-5">
          {productsModePanel}
          <FieldGrid
            fields={backContent}
            values={backSettings}
            onChange={handleBackFieldChange}
            sectionType={sectionType}
          />
          {previewEndpoint && <SectionEndpointPreview endpoint={previewEndpoint} />}
        </TabsContent>
      )}

      {/* ─── Layout: geometry + preview ─── */}
      {visibleGroups.has('layout') && (
        <TabsContent value="layout" className="mt-4 space-y-5">
          <SectionTypeConfig
            type={sectionType}
            frontSettings={frontSettings}
            onFrontChange={(settings) => onFrontChange(settings)}
          />
          <FieldGrid
            fields={frontLayout}
            values={frontSettings}
            onChange={handleFrontFieldChange}
            sectionType={sectionType}
          />
        </TabsContent>
      )}

      {/* ─── Media (hero only) ─── */}
      {visibleGroups.has('media') && (
        <TabsContent value="media" className="mt-4 space-y-5">
          <HeroMediaPicker values={frontSettings} onApply={handleFrontPatch} />
          <FieldGrid
            fields={frontMedia}
            values={frontSettings}
            onChange={handleFrontFieldChange}
            sectionType={sectionType}
          />
        </TabsContent>
      )}

      {/* ─── Extras: badge, timer, view-all, CTA, counts ─── */}
      {visibleGroups.has('extras') && (
        <TabsContent value="extras" className="mt-4 space-y-5">
          <FieldGrid
            fields={frontExtras}
            values={frontSettings}
            onChange={handleFrontFieldChange}
            sectionType={sectionType}
          />
        </TabsContent>
      )}

      {/* ─── Advanced: declared legacy flags + read-only Other Settings ─── */}
      {visibleGroups.has('advanced') && (
        <TabsContent value="advanced" className="mt-4 space-y-5">
          {(advancedFront.length > 0 || advancedBack.length > 0) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {advancedFront.map((spec) => (
                <SettingsField
                  key={`advanced-front-${spec.key}`}
                  spec={spec}
                  currentValue={frontSettings[spec.key]}
                  onChange={(value) => handleFrontFieldChange(spec.key, value)}
                  sectionType={sectionType}
                />
              ))}
              {advancedBack.map((spec) => (
                <SettingsField
                  key={`advanced-back-${spec.key}`}
                  spec={spec}
                  currentValue={backSettings[spec.key]}
                  onChange={(value) => handleBackFieldChange(spec.key, value)}
                  sectionType={sectionType}
                />
              ))}
            </div>
          )}
          <OtherSettingsBlock
            entries={unknownKeys}
            frontValues={frontSettings}
            backValues={backSettings}
            onFrontReplace={onFrontChange}
            onBackReplace={onBackChange}
          />
          <IgnoredSettingsBlock
            entries={ignoredEntries}
            backValues={backSettings}
            onBackReplace={onBackChange}
          />
        </TabsContent>
      )}
      </Tabs>

      {/* ─── Mode-switch confirmation (Preset ⇄ Custom) ─── */}
      <AlertDialog
        open={pendingMode !== null}
        onOpenChange={(open) => !open && setPendingMode(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingMode === 'preset'
                ? t('sections.modeSwitchToPresetTitle')
                : t('sections.modeSwitchToCustomTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingMode === 'preset'
                ? t('sections.modeSwitchToPresetConfirm', {
                    count: ignoredPresetKeys(backSettings).length,
                  })
                : t('sections.modeSwitchToCustomConfirm', {
                    count: ignoredPresetKeys(backSettings).length,
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingMode && applyMode(pendingMode)}>
              {t('sections.modeSwitchConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Field grid ──────────────────────────────────────────────────

interface FieldGridProps {
  fields: SettingsFieldSpec[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  sectionType: string;
}

function FieldGrid({ fields, values, onChange, sectionType }: FieldGridProps) {
  if (fields.length === 0) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((spec) => (
        <SettingsField
          key={spec.key}
          spec={spec}
          currentValue={values[spec.key]}
          onChange={(value) => onChange(spec.key, value)}
          sectionType={sectionType}
          limitValue={values.limit}
          onLimitChange={(limit) => onChange('limit', limit)}
        />
      ))}
    </div>
  );
}

// ─── "Other settings": read-only unknown saved keys ──────────────

interface UnknownKeyEntry {
  side: 'front' | 'back';
  spec: SettingsFieldSpec;
}

interface OtherSettingsBlockProps {
  entries: UnknownKeyEntry[];
  frontValues: Record<string, unknown>;
  backValues: Record<string, unknown>;
  /** Replaces the whole front/back record (edit / remove of one key). */
  onFrontReplace: (settings: Record<string, unknown>) => void;
  onBackReplace: (settings: Record<string, unknown>) => void;
}

type ValueType = 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object';

function valueTypeOf(value: unknown): ValueType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return typeof value as ValueType;
}

/** Plain-text rendering of a value — never HTML. */
function formatUnknownValue(value: unknown): string {
  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  if (typeof value === 'string' && value === '') return '""';
  return String(value);
}

/**
 * Saved keys the registry does not declare (including keys deliberately
 * removed from the form, such as order_price / parent_only). Rendered
 * read-only: one row per key with its path, a type badge and the value as
 * plain text. Per-row Edit opens a single-key JSON editor (must parse as
 * JSON; warns when the value type changes); per-row Remove deletes the key
 * after confirmation — the only way an unknown key is deleted. The payload
 * is always built from the original record overlaid with declared-field
 * edits, so unknown keys round-trip byte-for-byte unless edited here.
 */
function OtherSettingsBlock({
  entries,
  frontValues,
  backValues,
  onFrontReplace,
  onBackReplace,
}: OtherSettingsBlockProps) {
  const { t } = useTranslation();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<string | null>(null);
  /** Parsed value whose type differs from the saved one, awaiting confirmation. */
  const [pendingValue, setPendingValue] = useState<{ entry: UnknownKeyEntry; value: unknown } | null>(null);
  const [removing, setRemoving] = useState<UnknownKeyEntry | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  if (entries.length === 0) return null;

  const valuesFor = (side: 'front' | 'back') =>
    side === 'front' ? frontValues : backValues;

  const entryId = (entry: UnknownKeyEntry) => `${entry.side}.${entry.spec.key}`;

  const replaceValues = (side: 'front' | 'back', next: Record<string, unknown>) =>
    side === 'front' ? onFrontReplace(next) : onBackReplace(next);

  const startEdit = (entry: UnknownKeyEntry) => {
    setEditingKey(entryId(entry));
    setDraft(formatUnknownValue(valuesFor(entry.side)[entry.spec.key]));
    setDraftError(null);
    setPendingValue(null);
  };

  const closeEdit = () => {
    setEditingKey(null);
    setDraft('');
    setDraftError(null);
    setPendingValue(null);
  };

  const applyEdit = (entry: UnknownKeyEntry, value: unknown) => {
    const next = { ...valuesFor(entry.side), [entry.spec.key]: value };
    replaceValues(entry.side, next);
    closeEdit();
  };

  const handleSave = (entry: UnknownKeyEntry) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(draft);
    } catch {
      setDraftError(t('sections.otherSettingsInvalidJson'));
      setPendingValue(null);
      return;
    }
    const saved = valuesFor(entry.side)[entry.spec.key];
    if (valueTypeOf(parsed) !== valueTypeOf(saved)) {
      // Warn when the type changes; the user confirms explicitly.
      setPendingValue({ entry, value: parsed });
      return;
    }
    applyEdit(entry, parsed);
  };

  const toggleRow = (id: string) =>
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const confirmRemove = () => {
    if (!removing) return;
    const next = { ...valuesFor(removing.side) };
    delete next[removing.spec.key];
    replaceValues(removing.side, next);
    setRemoving(null);
  };

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-3">
      <div>
        <h5 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('sections.otherSettings')}
        </h5>
        <p className="mt-1 text-xs text-muted-foreground">{t('sections.otherSettingsHint')}</p>
      </div>

      <div className="space-y-2">
        {entries.map((entry) => {
          const id = entryId(entry);
          const value = valuesFor(entry.side)[entry.spec.key];
          const expanded = expandedRows.has(id);
          const isEditing = editingKey === id;

          if (isEditing) {
            const typeChanged =
              pendingValue?.entry === entry &&
              valueTypeOf(pendingValue.value) !== valueTypeOf(value);
            return (
              <div key={id} className="space-y-2 rounded-md border p-2">
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs font-medium">{id}</code>
                </div>
                <textarea
                  className="min-h-[80px] w-full rounded-md border bg-transparent px-2 py-1 font-mono text-xs"
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setDraftError(null);
                    setPendingValue(null);
                  }}
                />
                {draftError && <p className="text-xs text-destructive">{draftError}</p>}
                {typeChanged && pendingValue && (
                  <div className="space-y-1 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-amber-700 dark:text-amber-400">
                    <p>
                      {t('sections.otherSettingsTypeChanged', {
                        from: valueTypeOf(value),
                        to: valueTypeOf(pendingValue.value),
                      })}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={closeEdit}>
                    {t('common.cancel')}
                  </Button>
                  {pendingValue ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => applyEdit(pendingValue.entry, pendingValue.value)}
                    >
                      {t('sections.otherSettingsSaveAnyway')}
                    </Button>
                  ) : (
                    <Button type="button" size="sm" onClick={() => handleSave(entry)}>
                      {t('common.save')}
                    </Button>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div
              key={id}
              className="flex items-start justify-between gap-2 rounded-md border p-2"
            >
              <UnknownValueBody
                id={id}
                value={value}
                expanded={expanded}
                onToggle={() => toggleRow(id)}
              />
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('common.edit')}
                  onClick={() => startEdit(entry)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('common.delete')}
                  onClick={() => setRemoving(entry)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!removing} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('sections.otherSettingsRemoveTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('sections.otherSettingsRemoveConfirm', { key: removing?.spec.key ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Shared read-only value row ──────────────────────────────────

function UnknownValueBody({
  id,
  value,
  expanded,
  onToggle,
}: {
  id: string;
  value: unknown;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const display = formatUnknownValue(value);
  const isLong = display.length > 100 || display.includes('\n');
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <code className="font-mono text-xs font-medium">{id}</code>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
          {valueTypeOf(value)}
        </span>
      </div>
      {isLong ? (
        <>
          {expanded ? (
            <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded bg-muted/40 p-2 font-mono text-xs">
              {display}
            </pre>
          ) : (
            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
              {display.replace(/\s+/g, ' ')}
            </p>
          )}
          <button
            type="button"
            className="mt-1 text-xs text-primary underline-offset-2 hover:underline"
            onClick={onToggle}
          >
            {expanded
              ? t('sections.otherSettingsShowLess')
              : t('sections.otherSettingsShowMore')}
          </button>
        </>
      ) : (
        <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{display}</p>
      )}
    </div>
  );
}

// ─── "Ignored settings": inert leftovers of a Preset section ─────

interface IgnoredSettingsBlockProps {
  entries: UnknownKeyEntry[];
  backValues: Record<string, unknown>;
  onBackReplace: (settings: Record<string, unknown>) => void;
}

/**
 * Saved back keys a Preset section ignores (legacy filter ids, order,
 * order_price). They are listed read-only and kept until the user removes
 * them explicitly — one confirmed action clears them all.
 */
function IgnoredSettingsBlock({
  entries,
  backValues,
  onBackReplace,
}: IgnoredSettingsBlockProps) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  if (entries.length === 0) return null;

  const toggleRow = (id: string) =>
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const removeAll = () => {
    const next = { ...backValues };
    for (const entry of entries) delete next[entry.spec.key];
    onBackReplace(next);
    setConfirming(false);
  };

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-3">
      <div>
        <h5 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('sections.ignoredSettings')} ({entries.length})
        </h5>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('sections.ignoredSettingsHint')}
        </p>
      </div>
      <div className="space-y-2">
        {entries.map((entry) => {
          const id = `back.${entry.spec.key}`;
          const value = backValues[entry.spec.key];
          const expanded = expandedRows.has(id);
          return (
            <div
              key={id}
              className="flex items-start justify-between gap-2 rounded-md border p-2"
            >
              <UnknownValueBody
                id={id}
                value={value}
                expanded={expanded}
                onToggle={() => toggleRow(id)}
              />
            </div>
          );
        })}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)}>
        {t('sections.ignoredSettingsRemove')}
      </Button>

      <AlertDialog open={confirming} onOpenChange={(open) => !open && setConfirming(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('sections.ignoredSettingsRemoveTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('sections.ignoredSettingsRemoveConfirm', { count: entries.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={removeAll}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
