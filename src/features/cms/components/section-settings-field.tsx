import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { SearchableMultiSelect } from './searchable-multi-select';
import { SearchableSelect } from './searchable-select';
import {
  formatFieldLabel,
  fromLocalizedDraft,
  toLocalizedDraft,
  type SettingsFieldSpec,
} from '../lib/section-settings';

interface SettingsFieldProps {
  spec: SettingsFieldSpec;
  currentValue: unknown;
  onChange: (value: unknown) => void;
  sectionType?: string;
}

// The real endpoint is singular even though the setting key is plural.
const IDS_ENDPOINT_OVERRIDES: Record<string, string> = {
  flashSaleId: 'flash-sale',
  flashSalesId: 'flash-sale',
};

// "productsId" -> "products", "flashSalesId" -> "flash-sale",
// "categoriesId[]" -> "categories"
function idsEndpoint(key: string): string {
  const override = IDS_ENDPOINT_OVERRIDES[key];
  if (override) return override;
  return key
    .replace(/Ids?(?:\[\])?$/, '')
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase();
}

export function SettingsField({ spec, currentValue, onChange, sectionType }: SettingsFieldProps) {
  const { t } = useTranslation();
  const fieldId = useId();
  const label = spec.labelKey
    ? t(spec.labelKey)
    : formatFieldLabel(spec.key);

  const setDraftString = (text: string) => onChange(text ? text : null);

  // Banner slug: pick a banner from a searchable dropdown instead of typing it
  if (sectionType === 'banners' && spec.key === 'slug') {
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

  switch (spec.kind) {
    case 'boolean':
      return (
        <div className="flex items-center justify-between rounded-lg border p-3">
          <label htmlFor={fieldId} className="text-sm font-medium">{label}</label>
          <button
            id={fieldId}
            type="button"
            role="switch"
            aria-checked={!!currentValue}
            onClick={() => onChange(!currentValue)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors ${
              currentValue ? 'bg-primary' : 'bg-input'
            }`}
          >
            <span
              className={`pointer-events-none absolute start-0.5 top-0.5 block h-4 w-4 rounded-full bg-background shadow-sm transition-[inset-inline-start] ${
                currentValue ? 'start-[18px]' : ''
              }`}
            />
          </button>
        </div>
      );

    case 'number':
      return (
        <div className="space-y-1.5">
          <label htmlFor={fieldId} className="text-sm font-medium">{label}</label>
          <Input
            id={fieldId}
            type="number"
            min={spec.min}
            max={spec.max}
            step={spec.step}
            value={currentValue !== undefined && currentValue !== null ? String(currentValue) : ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          />
        </div>
      );

    case 'localized': {
      const draft = toLocalizedDraft(currentValue);
      return (
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium">{label}</label>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`${fieldId}-en`}
                className="mb-1 block text-xs font-medium uppercase text-muted-foreground"
              >
                {t('sections.fieldEnglish')}
              </label>
              <Input
                id={`${fieldId}-en`}
                type="text"
                dir="ltr"
                value={draft.en}
                onChange={(e) => onChange(fromLocalizedDraft(currentValue, { ...draft, en: e.target.value }))}
              />
            </div>
            <div>
              <label
                htmlFor={`${fieldId}-ar`}
                className="mb-1 block text-xs font-medium uppercase text-muted-foreground"
              >
                {t('sections.fieldArabic')}
              </label>
              <Input
                id={`${fieldId}-ar`}
                type="text"
                dir="rtl"
                value={draft.ar}
                onChange={(e) => onChange(fromLocalizedDraft(currentValue, { ...draft, ar: e.target.value }))}
              />
            </div>
          </div>
        </div>
      );
    }

    case 'select':
    case 'order': {
      const options =
        spec.kind === 'order'
          ? ['asc', 'desc']
          : spec.options ?? [];
      const currentText =
        currentValue !== null && currentValue !== undefined ? String(currentValue) : '';

      // No declared options, or a saved value outside the accepted list:
      // keep editing as text instead of hiding/destroying the stored value
      // (the backend stores `setting` as free-form data).
      if (options.length === 0 || (currentText !== '' && !options.includes(currentText))) {
        return (
          <div className="space-y-1.5">
            <label htmlFor={fieldId} className="text-sm font-medium">{label}</label>
            <Input
              id={fieldId}
              type="text"
              value={currentText}
              onChange={(e) => setDraftString(e.target.value)}
            />
            {options.length > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {t('sections.unknownSelectValue', { value: currentText })}
              </p>
            )}
          </div>
        );
      }
      return (
        <div className="space-y-1.5">
          <label htmlFor={fieldId} className="text-sm font-medium">{label}</label>
          <Select
            value={currentText}
            onValueChange={(v) => onChange(v || null)}
          >
            <SelectTrigger id={fieldId}>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    case 'date':
      return (
        <div className="space-y-1.5">
          <label htmlFor={fieldId} className="text-sm font-medium">{label}</label>
          <Input
            id={fieldId}
            type="date"
            value={currentValue as string || ''}
            onChange={(e) => onChange(e.target.value || null)}
          />
        </div>
      );

    case 'datetime':
      return (
        <div className="space-y-1.5">
          <label htmlFor={fieldId} className="text-sm font-medium">{label}</label>
          <Input
            id={fieldId}
            type="datetime-local"
            value={currentValue as string || ''}
            onChange={(e) => onChange(e.target.value || null)}
          />
        </div>
      );

    case 'ids': {
      const endpoint = idsEndpoint(spec.key);
      const selectedIds = Array.isArray(currentValue)
        ? currentValue.map(Number).filter((n) => !isNaN(n))
        : typeof currentValue === 'string' && currentValue
          ? currentValue.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n))
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
          <label htmlFor={fieldId} className="text-sm font-medium">{label}</label>
          <Input
            id={fieldId}
            type="text"
            value={currentValue !== null && currentValue !== undefined ? String(currentValue) : ''}
            onChange={(e) => setDraftString(e.target.value)}
          />
        </div>
      );
  }
}
