import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useTypeSettings, useProductTypes } from '../hooks/use-sections';
import { ProductTypeResponseError } from '../api/sections.api';
import { mergeSettingsFields } from '../lib/section-settings';
import { SettingsField } from './section-settings-field';
import { HeroMediaPicker } from './hero-media-picker';

// ─── Inline & hidden key bookkeeping ─────────────────────────────

// Front-settings keys rendered by the preview panel (SectionTypeConfig),
// filtered out of the merged settings list so the same setting is not edited
// in two places. Keep in sync with `section-type-config.tsx`.
const INLINE_FRONT_KEYS: Record<string, string[]> = {
  categories: ['shape'],
};

// Fields to skip in back settings when a product template is chosen
const PRODUCTS_TEMPLATE_HIDDEN_FIELDS = [
  'order_price',
  'categoriesId',
  'brandsId',
  'promotionsId',
  'flashSalesId',
  'bannersId',
  'couponsId',
];

// ─── Props ───────────────────────────────────────────────────────

interface DynamicSettingsFormProps {
  sectionType: string;
  frontSettings: Record<string, unknown>;
  backSettings: Record<string, unknown>;
  productType: string | null;
  onFrontChange: (settings: Record<string, unknown>) => void;
  onBackChange: (settings: Record<string, unknown>) => void;
  onProductTypeChange: (type: string | null) => void;
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
}: DynamicSettingsFormProps) {
  const { t } = useTranslation();
  const { data: typeSettingsData, isLoading: isLoadingSettings } = useTypeSettings(sectionType);
  const {
    data: productTypes = [],
    isLoading: isLoadingProductTypes,
    isError: isProductTypesError,
    error: productTypesError,
    refetch: refetchProductTypes,
  } = useProductTypes();

  const isProductsType = sectionType === 'products';
  const hasProductTemplate = isProductsType && !!productType;

  if (!sectionType) return null;

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ms-2 text-sm text-muted-foreground">
          {t('sections.loadingSettings')}
        </span>
      </div>
    );
  }

  const frontTemplate = typeSettingsData?.data?.front || {};
  const backTemplate = typeSettingsData?.data?.back || {};

  const hiddenBackKey = (key: string) => {
    // 'type' in back settings is handled by the product template selector
    if (isProductsType && key === 'type') return true;
    // With a product template chosen, hide fields the template already decides
    if (hasProductTemplate && PRODUCTS_TEMPLATE_HIDDEN_FIELDS.includes(key)) return true;
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

  // Declared fields (template + registry) plus the safety net: keys that only
  // exist in the section's saved data — they can never be invisible.
  const frontMerged = mergeSettingsFields(sectionType, 'front', frontTemplate, frontSettings, {
    inlineKeys: INLINE_FRONT_KEYS[sectionType] || [],
  });
  const backMerged = mergeSettingsFields(sectionType, 'back', backTemplate, backSettings, {
    hiddenPredicate: hiddenBackKey,
  });

  return (
    <div className="space-y-5">
      {/* ─── Product Template Selector ─── */}
      {isProductsType && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            {t('sections.productTemplate')}
          </label>
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
              <Select
                value={productType || '__none__'}
                onValueChange={(v) => onProductTypeChange(v === '__none__' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('sections.selectProductTemplate')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    {t('sections.noTemplate')}
                  </SelectItem>
                  {productTypes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {productTypes.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('sections.productTypesEmpty')}
                </p>
              )}
            </>
          )}
          <p className="text-xs text-muted-foreground">
            {hasProductTemplate
              ? t('sections.templateSelectedHint')
              : t('sections.templateNoneHint')}
          </p>
        </div>
      )}

      {/* ─── Front Settings (Display) ─── */}
      <FieldGroup
        title={t('sections.displaySettings')}
        fields={frontMerged.fields}
        values={frontSettings}
        onChange={handleFrontFieldChange}
        sectionType={sectionType}
        header={
          sectionType === 'hero' ? (
            <HeroMediaPicker values={frontSettings} onApply={handleFrontPatch} />
          ) : undefined
        }
      />

      {/* ─── Back Settings (Data) ─── */}
      <FieldGroup
        title={t('sections.dataSettings')}
        fields={backMerged.fields}
        values={backSettings}
        onChange={handleBackFieldChange}
        sectionType={sectionType}
      />

      {/* ─── Safety net: saved data keys not covered by the template ─── */}
      <ExtraFieldGroup
        frontExtra={frontMerged.extra}
        backExtra={backMerged.extra}
        frontValues={frontSettings}
        backValues={backSettings}
        onFrontChange={handleFrontFieldChange}
        onBackChange={handleBackFieldChange}
      />
    </div>
  );
}

// ─── Field group ─────────────────────────────────────────────────

interface FieldGroupProps {
  title: string;
  fields: ReturnType<typeof mergeSettingsFields>['fields'];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  sectionType: string;
  /** Optional block rendered above the field grid (e.g. hero media picker). */
  header?: ReactNode;
}

function FieldGroup({ title, fields, values, onChange, sectionType, header }: FieldGroupProps) {
  if (fields.length === 0 && !header) return null;
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      {header}
      {fields.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((spec) => (
            <SettingsField
              key={spec.key}
              spec={spec}
              currentValue={values[spec.key]}
              onChange={(value) => onChange(spec.key, value)}
              sectionType={sectionType}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── "Other settings" collapsible for undeclared saved keys ──────

interface ExtraFieldGroupProps {
  frontExtra: ReturnType<typeof mergeSettingsFields>['extra'];
  backExtra: ReturnType<typeof mergeSettingsFields>['extra'];
  /** Current values for front / back extras, kept separate to avoid
   * collisions between identically-named keys. */
  frontValues: Record<string, unknown>;
  backValues: Record<string, unknown>;
  onFrontChange: (key: string, value: unknown) => void;
  onBackChange: (key: string, value: unknown) => void;
}

function ExtraFieldGroup({
  frontExtra,
  backExtra,
  frontValues,
  backValues,
  onFrontChange,
  onBackChange,
}: ExtraFieldGroupProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (frontExtra.length === 0 && backExtra.length === 0) return null;

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-start"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('sections.otherSettings')}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <p className="text-xs text-muted-foreground">{t('sections.otherSettingsHint')}</p>
      {open && (
        <div className="grid gap-3 sm:grid-cols-2">
          {frontExtra.map((spec) => (
            <SettingsField
              key={`front-${spec.key}`}
              spec={spec}
              currentValue={frontValues[spec.key]}
              onChange={(value) => onFrontChange(spec.key, value)}
            />
          ))}
          {backExtra.map((spec) => (
            <SettingsField
              key={`back-${spec.key}`}
              spec={spec}
              currentValue={backValues[spec.key]}
              onChange={(value) => onBackChange(spec.key, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
