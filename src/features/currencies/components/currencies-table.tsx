import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, Crown, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLocalizedName } from '@/shared/lib/localize';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { CurrencyDeleteDialog } from './currency-delete-dialog';
import { SetBaseCurrencyDialog } from './set-base-currency-dialog';
import { SetCatalogCurrencyDialog } from './set-catalog-currency-dialog';
import type { Currency } from '../types/currency.types';

interface CurrenciesTableProps {
  data: Currency[];
  isLoading: boolean;
  onEdit: (currency: Currency) => void;
  onRefresh: () => void;
}

export function CurrenciesTable({
  data,
  isLoading,
  onEdit,
  onRefresh,
}: CurrenciesTableProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const [deleteTarget, setDeleteTarget] = useState<Currency | null>(null);
  const [baseTarget, setBaseTarget] = useState<Currency | null>(null);
  const [catalogTarget, setCatalogTarget] = useState<Currency | null>(null);

  if (isLoading) return <TableSkeleton />;

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
              <TableHead>{t('currencyForm.code')}</TableHead>
              <TableHead>{t('currencyForm.numericCode') || 'Num. Code'}</TableHead>
              <TableHead>{t('currencyForm.nameEn')}</TableHead>
              <TableHead>{t('currencyForm.symbol')}</TableHead>
              <TableHead>{t('currencyForm.country')}</TableHead>
              <TableHead>{t('currencyForm.decimals')}</TableHead>
              <TableHead>{t('currency.active')}</TableHead>
              <TableHead>{t('currency.badges') || 'Badges'}</TableHead>
              <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((currency) => (
              <TableRow key={currency.id}>
                <TableCell className="font-mono font-semibold tracking-wide">
                  {currency.code}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {currency.numeric_code || '—'}
                </TableCell>
                <TableCell>
                  <span className="font-medium">{getLocalizedName(currency.name, lang)}</span>
                  <span className="block text-xs text-muted-foreground">
                    {getLocalizedName(currency.name, lang === 'ar' ? 'en' : 'ar')}
                  </span>
                </TableCell>
                <TableCell>{getLocalizedName(currency.symbol, lang) || '—'}</TableCell>
                <TableCell>{getLocalizedName(currency.country_name, lang) || '—'}</TableCell>
                <TableCell>{currency.decimal_places}</TableCell>
                <TableCell>
                  {currency.is_active ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      {t('currency.active')}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{t('currency.inactive')}</Badge>
                  )}
                </TableCell>
                {/* Badges: base + catalog */}
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {currency.is_base && (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        <Crown className="me-1 h-3 w-3" />
                        {t('currency.base')}
                      </Badge>
                    )}
                    {currency.is_catalog && (
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        <BookOpen className="me-1 h-3 w-3" />
                        {t('currency.catalog') || 'Catalog'}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="h-8 w-8 p-0" />}>
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">{t('common.actions')}</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(currency)}>
                        <Pencil className="me-2 h-4 w-4" />
                        {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setBaseTarget(currency)}
                        disabled={currency.is_base}
                      >
                        <Crown className="me-2 h-4 w-4" />
                        {t('currency.setBase')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setCatalogTarget(currency)}
                        disabled={currency.is_catalog}
                      >
                        <BookOpen className="me-2 h-4 w-4" />
                        {t('currency.setCatalog')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(currency)}
                        disabled={currency.is_base}
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

      <CurrencyDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        currency={deleteTarget}
        onDeleted={onRefresh}
      />
      <SetBaseCurrencyDialog
        open={!!baseTarget}
        onOpenChange={(open) => !open && setBaseTarget(null)}
        currency={baseTarget}
        onBaseChanged={onRefresh}
      />
      <SetCatalogCurrencyDialog
        open={!!catalogTarget}
        onOpenChange={(open) => !open && setCatalogTarget(null)}
        currency={catalogTarget}
        onCatalogChanged={onRefresh}
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
            <TableHead>{t('currencyForm.code')}</TableHead>
            <TableHead>{t('currencyForm.numericCode') || 'Num. Code'}</TableHead>
            <TableHead>{t('currencyForm.nameEn')}</TableHead>
            <TableHead>{t('currencyForm.symbol')}</TableHead>
            <TableHead>{t('currencyForm.country')}</TableHead>
            <TableHead>{t('currencyForm.decimals')}</TableHead>
            <TableHead>{t('currency.active')}</TableHead>
            <TableHead>{t('currency.badges') || 'Badges'}</TableHead>
            <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
