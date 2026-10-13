import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { LICENSE_KEY_MAX_LENGTH, LICENSE_KEYS_MAX_BATCH } from '../types/digital-asset.types';

interface LicenseKeyInputsProps {
  /** Row values; an empty list renders the single default input. */
  values: string[];
  onChange: (values: string[]) => void;
  /** Batch cap (defaults to the backend 500). */
  maxKeys?: number;
}

/**
 * Independent key inputs for license provisioning.
 * - starts with ONE default input; "+ Add Key" appends rows (capped at max);
 * - per-row remove button (the last remaining row cannot be removed);
 * - pasting multi-line text into a row auto-splits it into new rows so
 *   bulk imports keep working without the old one-per-line textarea.
 */
export function LicenseKeyInputs({
  values,
  onChange,
  maxKeys = LICENSE_KEYS_MAX_BATCH,
}: LicenseKeyInputsProps) {
  const { t } = useTranslation();
  const rows: string[] = values.length > 0 ? values : [''];

  const handleRowChange = (index: number, raw: string) => {
    if (/\r?\n/.test(raw)) {
      // Multi-line paste: replace the touched row with the parsed batch
      // (trimmed, blanks dropped, duplicates removed within the batch).
      const pasted = raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      const seen = new Set<string>(rows.filter((_, i) => i !== index));
      const deduped = Array.from(new Set(pasted)).filter((line) => {
        if (seen.has(line)) return false;
        seen.add(line);
        return true;
      });
      onChange([...rows.slice(0, index), ...deduped, ...rows.slice(index + 1)]);
      return;
    }
    const next = [...rows];
    next[index] = raw;
    onChange(next);
  };

  const addRow = () => {
    if (rows.filter((row) => row.length > 0).length >= maxKeys) return;
    onChange([...rows, '']);
  };

  const removeRow = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : ['']);
  };

  const filledCount = rows.filter((row) => row.trim().length > 0).length;

  return (
    <div className="space-y-2">
      {rows.map((value, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={value}
            maxLength={LICENSE_KEY_MAX_LENGTH}
            placeholder={`KEY-${index + 1}`}
            className={
              value.length > LICENSE_KEY_MAX_LENGTH ? 'border-destructive' : undefined
            }
            onChange={(e) => handleRowChange(index, e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={rows.length <= 1}
            onClick={() => removeRow(index)}
            aria-label={t('digitalAssets.keysInput.remove')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={rows.filter((row) => row.length > 0).length >= maxKeys}
        >
          <Plus className="me-1 h-4 w-4" />
          {t('digitalAssets.keysInput.add')}
        </Button>
        <span
          className={
            filledCount > maxKeys ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'
          }
        >
          {t('digitalAssets.limits.keys', { count: filledCount })}
        </span>
      </div>
    </div>
  );
}
