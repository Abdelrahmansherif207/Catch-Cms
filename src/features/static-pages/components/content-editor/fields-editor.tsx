import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/lib/utils';
import type { JsonObject, JsonValue } from '../../types/static-page.types';

// Simple form editor: each content field is a "name → value" pair,
// matching the stored content shape { "heading": "Welcome", ... }.
// Only string values are editable; legacy non-string values are kept
// intact and shown read-only so nothing is lost on save.

interface FieldsEditorProps {
  value: JsonObject;
  onChange: (next: JsonObject) => void;
  error?: string;
  localeLabel?: string;
}

export function FieldsEditor({ value, onChange, error, localeLabel }: FieldsEditorProps) {
  const { t } = useTranslation();
  const entries = Object.entries(value);

  const handleRename = (oldKey: string, newKey: string): boolean => {
    const trimmed = newKey.trim();
    if (!trimmed || trimmed === oldKey) return false;
    if (trimmed in value) return false;
    const next = { ...value };
    next[trimmed] = next[oldKey];
    delete next[oldKey];
    onChange(next);
    return true;
  };

  const handleValueChange = (key: string, nextValue: JsonValue) => {
    onChange({ ...value, [key]: nextValue });
  };

  const handleRemove = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  const handleAdd = () => {
    let index = 1;
    let candidate = t('staticPages.contentEditor.newField') || 'heading';
    while (candidate in value) {
      candidate = `heading_${index}`;
      index += 1;
    }
    onChange({ ...value, [candidate]: '' });
  };

  return (
    <div
      className={cn('space-y-2 rounded-lg border p-3', error && 'border-destructive/60')}
      role="group"
      aria-label={localeLabel}
    >
      {localeLabel && (
        <span className="text-xs font-medium text-muted-foreground">{localeLabel}</span>
      )}
      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground">{t('staticPages.contentEditor.emptyFields')}</p>
      )}
      {entries.map(([key, entryValue]) => (
        <FieldRow
          key={key}
          fieldKey={key}
          fieldValue={entryValue}
          onRename={(nextKey) => handleRename(key, nextKey)}
          onValueChange={(nextValue) => handleValueChange(key, nextValue)}
          onRemove={() => handleRemove(key)}
        />
      ))}
      <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
        <Plus className="me-1 h-3.5 w-3.5" />
        {t('staticPages.contentEditor.addField')}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FieldRow({
  fieldKey,
  fieldValue,
  onRename,
  onValueChange,
  onRemove,
}: {
  fieldKey: string;
  fieldValue: JsonValue;
  onRename: (nextKey: string) => boolean;
  onValueChange: (nextValue: JsonValue) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(fieldKey);
  const isEditable = typeof fieldValue === 'string';
  const fieldNameLabel = t('staticPages.contentEditor.keyLabel');
  const valueLabel = t('staticPages.contentEditor.valueLabel');

  const commitRename = () => {
    const ok = onRename(draft);
    if (!ok) setDraft(fieldKey);
  };

  return (
    <div className="flex items-center gap-1.5">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitRename}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commitRename();
            e.currentTarget.blur();
          }
        }}
        className="h-8 w-40 font-mono text-xs"
        aria-label={fieldNameLabel}
        placeholder={t('staticPages.contentEditor.namePlaceholder')}
      />
      {isEditable ? (
        <Input
          value={fieldValue}
          onChange={(e) => onValueChange(e.target.value)}
          className="h-8 text-xs"
          aria-label={valueLabel}
          placeholder={valueLabel}
        />
      ) : (
        <div
          className="h-8 min-w-0 flex-1 truncate rounded-md border border-dashed bg-muted/40 px-3 font-mono text-xs leading-8 text-muted-foreground"
          title={JSON.stringify(fieldValue)}
        >
          {JSON.stringify(fieldValue)}
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-muted-foreground hover:text-destructive"
        aria-label={t('staticPages.contentEditor.removeKey')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}