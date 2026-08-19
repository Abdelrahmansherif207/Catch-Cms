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
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between', className)}>
      <p className="text-sm text-muted-foreground">
        {t('common.showing')} {from} {t('common.to')} {to} {t('common.of')} {total} &mdash; {t('common.page')} {page} {t('common.of')} {lastPage} ({perPage} {t('common.perPage')})
      </p>
      <div className="flex items-center gap-1">
        <Button
          key="prev"
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pages.map((p, i) => {
          const key = p === 'ellipsis' ? `ellipsis-${i}` : `page-${p}`;
          return p === 'ellipsis' ? (
            <span key={key} className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={key}
              variant={p === page ? 'default' : 'outline'}
              size="icon-sm"
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          );
        })}
        <Button
          key="next"
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= lastPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
