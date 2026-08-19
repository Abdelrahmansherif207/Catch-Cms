import { useState } from 'react';
import {
  Trash2,
  Pencil,
  MoreHorizontal,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLocalizedName, type LocalizedName } from '@/shared/lib/localize';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { CurrencyRateDeleteDialog } from './currency-rate-delete-dialog';
import type { ExchangeRate } from '../types/currency.types';

interface ExchangeRatesTableProps {
  data: ExchangeRate[];
  isLoading: boolean;
  currencyName?: string | LocalizedName | null;
  onEdit: (rate: ExchangeRate) => void;
  onRefresh: () => void;
}

export function ExchangeRatesTable({
  data,
  isLoading,
  currencyName,
  onEdit,
  onRefresh,
}: ExchangeRatesTableProps) {
const { t, i18n } = useTranslation();
  const [deleteTarget, setDeleteTarget] = useState<ExchangeRate | null>(null);

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border">
        <div className="flex h-24 items-center justify-center">
          <p className="text-muted-foreground">{t('common.noData')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">{t('currencyRates.date')}</TableHead>
              <TableHead>{t('currencyRates.rate')}</TableHead>
              <TableHead>{t('currencyRates.currency')}</TableHead>
              <TableHead>{t('currencyRates.baseRate')}</TableHead>
              <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell>{new Date(rate.effective_date).toLocaleDateString()}</TableCell>
                <TableCell>{Number(rate.exchange_rate).toFixed(4)}</TableCell>
                <TableCell>{getLocalizedName(currencyName ?? null, i18n.language || 'en')}</TableCell>
                <TableCell>{(1 / Number(rate.exchange_rate)).toFixed(4)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="h-8 w-8 p-0" />}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onEdit(rate)}
                      >
                        <Pencil className="me-2 h-4 w-4" />
                        {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteTarget(rate)}
                      >
                        <Trash2 className="me-2 h-4 w-4" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <CurrencyRateDeleteDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        rate={deleteTarget}
        onDeleted={onRefresh}
      />
    </>
  );
}

function TableSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">{t('currencyRates.date')}</TableHead>
            <TableHead>{t('currencyRates.rate')}</TableHead>
            <TableHead>{t('currencyRates.currency')}</TableHead>
            <TableHead>{t('currencyRates.baseRate')}</TableHead>
            <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-12" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
