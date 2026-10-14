import { useTranslation } from 'react-i18next';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { BatchStatus } from '../types/batch.types';

interface BatchLifecycleStepperProps {
  status: BatchStatus | string;
  className?: string;
}

/**
 * The five-step wave flow as one visual unit: Group → Give → Begin →
 * Pick → Finish. Current step is highlighted; done steps are checked;
 * a cancelled batch collapses to a banner (no fake progress).
 */
const STEPS = ['pending', 'assigned', 'picking', 'completed'] as const;

export function BatchLifecycleStepper({ status, className }: BatchLifecycleStepperProps) {
  const { t } = useTranslation();

  if (status === 'cancelled') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-2xl border bg-muted px-4 py-3 text-sm text-muted-foreground',
          className
        )}
      >
        <XCircle className="h-5 w-5 shrink-0" />
        <span className="font-medium">{t('batches.stepperCancelled')}</span>
      </div>
    );
  }

  const currentIndex = STEPS.indexOf((status || 'pending') as (typeof STEPS)[number]);

  return (
    <ol className={cn('flex flex-col gap-1 sm:flex-row sm:items-center', className)}>
      {STEPS.map((step, index) => {
        const done = index < currentIndex || status === 'completed';
        const current = index === currentIndex && status !== 'completed';
        return (
          <li key={step} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                done && 'border-success bg-success text-white',
                current && 'border-primary bg-primary-soft text-primary',
                !done && !current && 'border-muted bg-muted text-muted-foreground'
              )}
            >
              {done ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : current ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  'block text-sm font-medium',
                  current ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {t('batches.steps.' + step)}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {t('batches.stepsHint.' + step)}
              </span>
            </span>
            {index < STEPS.length - 1 && (
              <span
                className={cn(
                  'mx-2 hidden h-0.5 flex-1 rounded sm:block',
                  done ? 'bg-success' : 'bg-muted'
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
