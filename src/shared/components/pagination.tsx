import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

interface PaginationProps {
  page: number;
  lastPage: number;
  total: number;
  from: number;
  to: number;
  perPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  lastPage,
  total,
  from,
  to,
  perPage,
  onPageChange,
  className,
}: PaginationProps) {
  const { t } = useTranslation();

  if (total <= 0) return null;

  const pages: (number | 'ellipsis')[] = [];

  if (lastPage <= 7) {
    for (let i = 1; i <= lastPage; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('ellipsis');

    const rangeStart = Math.max(2, page - 1);
    const rangeEnd = Math.min(lastPage - 1, page + 1);
    for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);

    if (page < lastPage - 2) pages.push('ellipsis');
    pages.push(lastPage);
  }

  return (
    <div data-slot="pagination" className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <p className="text-sm text-muted-foreground">
        {t('common.showing')}{' '}
        <span className="font-semibold text-foreground">{from}–{to}</span>{' '}
        {t('common.of')}{' '}
        <span className="font-semibold text-foreground">{total}</span>{' '}
        {t('common.results')} · {perPage} {t('common.perPage')}
        <span className="mx-2 text-border">|</span>
        {t('common.page')}{' '}
        <span className="font-semibold text-foreground">{page}</span>{' '}
        {t('common.of')} {lastPage}
      </p>
      <div className="flex w-fit items-center gap-0.5 rounded-xl border bg-card p-1 shadow-xs">
        <Button
          key="prev"
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label={t('common.previous')}
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </Button>
        {pages.map((p, i) => {
          const key = p === 'ellipsis' ? `ellipsis-${i}` : `page-${p}`;
          return p === 'ellipsis' ? (
            <span key={key} className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={key}
              variant="ghost"
              size="icon-sm"
              onClick={() => onPageChange(p)}
              aria-label={`${t('common.page')} ${p}`}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'min-w-8 font-medium tabular-nums',
                p === page && 'bg-primary text-primary-foreground shadow-xs hover:bg-primary hover:text-primary-foreground'
              )}
            >
              {p}
            </Button>
          );
        })}
        <Button
          key="next"
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= lastPage}
          aria-label={t('common.next')}
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
