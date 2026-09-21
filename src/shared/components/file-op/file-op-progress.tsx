import { useTranslation } from 'react-i18next';

interface FileOpProgressProps {
  progress: number | null | undefined;
  processed: number | null | undefined;
  total: number | null | undefined;
  success: number | null | undefined;
  failed: number | null | undefined;
  successLabel: string;
}

/**
 * Shared live progress block for import/export dialogs. Renders backend
 * numbers verbatim (`progress` 0..100, row counters). `total: null` (early
 * `queued`) renders "calculating total" instead of a fake number.
 */
export function FileOpProgress({
  progress,
  processed,
  total,
  success,
  failed,
  successLabel,
}: FileOpProgressProps) {
  const { t } = useTranslation();
  // `null` progress (e.g. early export `queued` with unknown total) renders an
  // indeterminate bar instead of a fake 0%.
  const pct = progress == null ? null : Math.min(progress, 100);
  const done = processed || 0;
  const ok = success || 0;
  const bad = failed || 0;

  return (
    <div className="space-y-4 py-2" aria-live="polite">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('common.progress')}</span>
          <span className="font-medium tabular-nums">{pct == null ? '…' : `${pct}%`}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={
              pct == null
                ? 'h-full w-full animate-pulse rounded-full bg-primary/60'
                : 'h-full rounded-full bg-primary transition-all duration-500'
            }
            style={pct == null ? undefined : { width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">{t('common.processedRows')}</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">
            {done}
            {total ? ` / ${total}` : ` · ${t('common.calculatingTotal')}`}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">{successLabel}</p>
          <p className="mt-0.5 text-lg font-semibold text-success tabular-nums">{ok}</p>
        </div>
      </div>

      {bad > 0 && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-center">
          <p className="text-xs text-muted-foreground">{t('common.failedRows')}</p>
          <p className="mt-0.5 text-lg font-semibold text-destructive tabular-nums">{bad}</p>
        </div>
      )}
    </div>
  );
}
