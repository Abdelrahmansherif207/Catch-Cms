import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { sectionTypeImage } from '../lib/section-type-images';

interface SectionTypeConfigProps {
  type: string;
  frontSettings: Record<string, unknown>;
  onFrontChange: (settings: Record<string, unknown>) => void;
}

/**
 * Composite preview wiring only — the per-type display/data settings are
 * rendered generically by `DynamicSettingsForm` (template + registry).
 * Keep `INLINE_FRONT_KEYS` in dynamic-settings-form.tsx in sync with this:
 * any key handled here must be listed there so the two never duplicate.
 */
export function SectionTypeConfig({
  type,
  frontSettings,
  onFrontChange,
}: SectionTypeConfigProps) {
  const { t } = useTranslation();
  if (!type) return null;

  const set = (key: string, value: unknown) => {
    onFrontChange({ ...frontSettings, [key]: value });
  };

  const val = (key: string) => frontSettings[key];

  const shapeRaw = val('shape');
  const shapeText =
    typeof shapeRaw === 'string'
      ? shapeRaw
      : shapeRaw === null || shapeRaw === undefined
        ? ''
        : String(shapeRaw);
  const isUnknownShape = shapeText !== '' && !isShape(shapeText);
  // Unknown values keep the preview on the registry default without rewriting
  // the stored value — the text input below edits it only when the user does.
  const shape = isShape(shapeText) ? shapeText : 'square';
  const previewImage = sectionTypeImage(type, { shape });

  return (
    <div className="space-y-4">
      {/* ─── Type preview ─── */}
      {previewImage && (
        <div className="flex justify-center rounded-lg border bg-muted/20 p-3">
          <img
            src={previewImage}
            alt={type === 'categories' ? `Categories ${shape}` : type}
            className="h-auto w-full max-w-[260px] rounded-md"
          />
        </div>
      )}

      {/* ─── shape (categories only) — toggles the preview too ─── */}
      {type === 'categories' && (
        <div className="mx-auto max-w-[260px] space-y-1.5">
          <label htmlFor="section-shape" className="text-sm font-medium">
            {t('sections.shape')}
          </label>
          {isUnknownShape ? (
            <>
              {/* Unknown saved value: keep it editable as text (the backend
                  stores settings as free-form data) instead of coercing it. */}
              <Input
                id="section-shape"
                type="text"
                value={shapeText}
                onChange={(e) => set('shape', e.target.value)}
              />
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {t('sections.unknownSelectValue', { value: shapeText })}
              </p>
            </>
          ) : (
            <Select value={shape} onValueChange={(v) => set('shape', v)}>
              <SelectTrigger id="section-shape">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="square">{t('sections.square')}</SelectItem>
                <SelectItem value="circle">{t('sections.circle')}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  );
}

function isShape(value: unknown): value is string {
  return value === 'square' || value === 'circle';
}
