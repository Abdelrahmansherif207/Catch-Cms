import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/ui/input';
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
import { Loader2, RefreshCw } from 'lucide-react';
import { SearchableMultiSelect } from './searchable-multi-select';
import { SearchableSelect } from './searchable-select';

// ─── Field type inference from template value ────────────────────

type FieldType = 'boolean' | 'number' | 'string' | 'select-order' | 'date' | 'ids-array';

function inferFieldType(key: string, value: unknown): FieldType {
  if (key === 'order' || key === 'order_price') return 'select-order';
  if (key === 'start_date' || key === 'end_date') return 'date';
  if (key.endsWith('Id') || key.endsWith('Id[]')) return 'ids-array';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (Array.isArray(value)) return 'ids-array';
  return 'string';
}

function formatFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

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

// Front-settings keys that are already rendered by the curated inline panel
// (SectionTypeConfig). Filtered out of the template-driven front list so the
// same setting is not edited in two places. Keep in sync with
// `section-type-config.tsx`.
const INLINE_FRONT_KEYS: Record<string, string[]> = {
  banners: ['columns_count'],
  promotions: ['columns_count'],
  categories: ['columns_count'],
  'flash-sales': ['columns_count', 'show_timer', 'timer_end_at'],
  products: ['columns_count', 'badge_text'],
  sliders: ['autoplay', 'slider_speed'],
  brands: ['columns_count'],
};

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

  const settingsTemplate = typeSettingsData?.data;
  if (!settingsTemplate) return null;

  const frontTemplate = settingsTemplate.front || {};
  const backTemplate = settingsTemplate.back || {};

  // Skip front keys the curated inline panel already renders.
  const inlineKeys = INLINE_FRONT_KEYS[sectionType] || [];
  const templateFrontFields = Object.entries(frontTemplate).filter(
    ([key]) => !inlineKeys.includes(key)
  );

  const handleFrontFieldChange = (key: string, value: unknown) => {
    onFrontChange({ ...frontSettings, [key]: value });
  };

  const handleBackFieldChange = (key: string, value: unknown) => {
    onBackChange({ ...backSettings, [key]: value });
  };

  // Decide which back fields to show
  const visibleBackFields = Object.entries(backTemplate).filter(([key]) => {
    // Skip 'type' field in back settings — handled by product template selector
    if (isProductsType && key === 'type') return false;
    // If product template is chosen, hide irrelevant fields
    if (hasProductTemplate && PRODUCTS_TEMPLATE_HIDDEN_FIELDS.includes(key)) return false;
    return true;
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
      {templateFrontFields.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t('sections.displaySettings')}
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {templateFrontFields.map(([key, templateValue]) => (
              <SettingsField
                key={key}
                sectionType={sectionType}
                fieldKey={key}
                templateValue={templateValue}
                currentValue={frontSettings[key]}
                onChange={(value) => handleFrontFieldChange(key, value)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── Back Settings (Data) ─── */}
      {visibleBackFields.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t('sections.dataSettings')}
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleBackFields.map(([key, templateValue]) => (
              <SettingsField
                key={key}
                sectionType={sectionType}
                fieldKey={key}
                templateValue={templateValue}
                currentValue={backSettings[key]}
                onChange={(value) => handleBackFieldChange(key, value)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Individual Settings Field ───────────────────────────────────

interface SettingsFieldProps {
  fieldKey: string;
  templateValue: unknown;
  currentValue: unknown;
  onChange: (value: unknown) => void;
  sectionType?: string;
}

function SettingsField({ fieldKey, templateValue, currentValue, onChange, sectionType }: SettingsFieldProps) {
  const fieldType = inferFieldType(fieldKey, templateValue);
  const label = formatFieldLabel(fieldKey);

  // Banner slug: pick a banner from a searchable dropdown instead of typing it
  if (sectionType === 'banners' && fieldKey === 'slug') {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{label}</label>
        <SearchableSelect
          endpoint="banners"
          value={currentValue ? String(currentValue) : null}
          onChange={(v) => onChange(v)}
          placeholder={`Select ${label.toLowerCase()}...`}
        />
      </div>
    );
  }

  switch (fieldType) {
    case 'boolean':
      return (
        <div className="flex items-center justify-between rounded-lg border p-3">
          <label className="text-sm font-medium">{label}</label>
          <button
            type="button"
            role="switch"
            aria-checked={!!currentValue}
            onClick={() => onChange(!currentValue)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
              currentValue
                ? 'bg-primary'
                : 'bg-input'
            }`}
          >
            <span
              className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${
                currentValue ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      );

    case 'number':
      return (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{label}</label>
          <Input
            type="number"
            value={currentValue !== undefined && currentValue !== null ? String(currentValue) : ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={templateValue !== null ? String(templateValue) : ''}
          />
        </div>
      );

    case 'select-order':
      return (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{label}</label>
          <Select
            value={currentValue as string || ''}
            onValueChange={(v) => onChange(v || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );

    case 'date':
      return (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{label}</label>
          <Input
            type="date"
            value={currentValue as string || ''}
            onChange={(e) => onChange(e.target.value || null)}
          />
        </div>
      );

    case 'ids-array': {
      // Derive endpoint from fieldKey, e.g. "productsId" -> "products", "flashSalesId" -> "flash-sales", "categoriesId[]" -> "categories"
      const endpoint = fieldKey
        .replace(/Id(?:\[\])?$/, '')
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase();

      const selectedIds = Array.isArray(currentValue) 
        ? currentValue.map(Number).filter((n) => !isNaN(n))
        : typeof currentValue === 'string' && currentValue
          ? currentValue.split(',').map(s => Number(s.trim())).filter((n) => !isNaN(n))
          : typeof currentValue === 'number'
            ? [currentValue]
            : [];

      return (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{label}</label>
          <SearchableMultiSelect
            endpoint={endpoint}
            selectedIds={selectedIds}
            onChange={(ids) => onChange(ids)}
            placeholder={`Select ${label.toLowerCase()}...`}
          />
        </div>
      );
    }

    default:
      return (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{label}</label>
          <Input
            type="text"
            value={currentValue !== null && currentValue !== undefined ? String(currentValue) : ''}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder={templateValue !== null ? String(templateValue) : ''}
          />
        </div>
      );
  }
}
