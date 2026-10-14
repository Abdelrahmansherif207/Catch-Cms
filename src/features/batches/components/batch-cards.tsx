import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CalendarClock, User } from 'lucide-react';
import { BatchStatusBadge } from './batch-status-badge';
import { batchRoutes } from '../routes/batch.routes';
import { batchProgress } from '../schemas/batch.schema';
import type { BatchListItem } from '../types/batch.types';

interface BatchCardsProps {
  data: BatchListItem[];
}

/**
 * Launchpad cards (approved over a dense table): batch number, status,
 * assignee, wave chip, and a BIG progress bar — glanceable for
 * non-technical operators. Click anywhere → the guided detail hub.
 */
export function BatchCards({ data }: BatchCardsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {data.map((batch) => {
        const progress = batchProgress(batch);
        return (
          <button
            key={batch.id}
            type="button"
            onClick={() => navigate(batchRoutes.detail(batch.id))}
            className="rounded-2xl border bg-card p-4 text-start shadow-card transition-colors hover:border-primary/40 hover:bg-muted/30"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-sm font-bold">{batch.batch_number}</span>
              <BatchStatusBadge status={batch.status} />
            </div>

            <div className="mt-3 flex items-end justify-between gap-2">
              <p className="font-mono text-2xl font-bold">
                {progress.picked}
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  / {progress.total}
                </span>
              </p>
              <p className="font-mono text-sm text-muted-foreground">
                {Math.round(progress.percent)}%
              </p>
            </div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success transition-all"
                style={{ width: progress.percent + '%' }}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {batch.assigned_to !== null ? (
                <span className="flex items-center gap-1 rounded-full bg-info-soft px-2.5 py-0.5 text-info">
                  <User className="h-3 w-3" />
                  #{batch.assigned_to}
                </span>
              ) : (
                <span className="rounded-full bg-muted px-2.5 py-0.5">
                  {t('batches.unassigned')}
                </span>
              )}
              <span className="rounded-full bg-muted px-2.5 py-0.5 uppercase">
                {t('batches.typeWave')}
              </span>
              {batch.created_at && (
                <span className="flex items-center gap-1">
                  <CalendarClock className="h-3 w-3" />
                  {formatDate(batch.created_at)}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
