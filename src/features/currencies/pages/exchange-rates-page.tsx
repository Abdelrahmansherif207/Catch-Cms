import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import { useCurrencies, useExchangeRates } from '../hooks/use-currencies';
import { ExchangeRatesTable } from '../components/exchange-rates-table';
import { ExchangeRateFormDialog } from '../components/exchange-rate-form-dialog';
import type { ExchangeRate } from '../types/currency.types';

export function ExchangeRatesPage() {
  const { t } = useTranslation();
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const { data: currenciesData } = useCurrencies({ perPage: 100 });
  const currencies = currenciesData?.data?.data ?? [];

  const selectedCurrency = currencies.find((c) => c.id === selectedCurrencyId);

  const { data: ratesData, isLoading: ratesLoading, refetch: refetchRates } = useExchangeRates({
    currency_id: selectedCurrencyId ?? undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const rates = ratesData?.data?.data ?? [];

  const handleCreateRate = () => {
    setEditingRate(null);
    setFormOpen(true);
  };

  const handleEditRate = (rate: ExchangeRate) => {
    setEditingRate(rate);
    setFormOpen(true);
  };

  const handleRateFormSuccess = () => {
    setFormOpen(false);
    setEditingRate(null);
    refetchRates();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('exchangeRates.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('exchangeRates.subtitle')}</p>
        </div>
        <Button onClick={handleCreateRate} disabled={!selectedCurrencyId}>
          <Plus className="me-2 h-4 w-4" />
          {t('exchangeRates.addRate')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={selectedCurrencyId?.toString() ?? ''}
          onValueChange={(v) => {
            setSelectedCurrencyId(v ? Number(v) : null);
            setEditingRate(null);
            setFormOpen(false);
          }}
        >
          <SelectTrigger className="h-9 w-full md:w-[200px]">
            <SelectValue placeholder={t('exchangeRates.selectCurrency')} />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((currency) => (
              <SelectItem key={currency.id} value={currency.id.toString()}>
                {currency.code} — {typeof currency.name === 'object' ? (currency.name as { en: string; ar: string }).en : currency.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 w-full md:w-[150px]"
            placeholder={t('exchangeRates.dateFrom')}
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 w-full md:w-[150px]"
            placeholder={t('exchangeRates.dateTo')}
          />
        </div>

        {(dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setDateFrom(''); setDateTo(''); }}
          >
            {t('common.clear')}
          </Button>
        )}
      </div>

      {selectedCurrencyId ? (
        <ExchangeRatesTable
          data={rates}
          isLoading={ratesLoading}
          currencyName={selectedCurrency?.name}
          onEdit={handleEditRate}
          onRefresh={refetchRates}
        />
      ) : (
        <div className="rounded-lg border">
          <div className="flex h-24 items-center justify-center">
            <p className="text-muted-foreground">{t('exchangeRates.selectCurrencyHint')}</p>
          </div>
        </div>
      )}

      {selectedCurrencyId && (
        <ExchangeRateFormDialog
          rate={editingRate}
          currencyId={selectedCurrencyId}
          open={formOpen}
          onOpenChange={setFormOpen}
          onSuccess={handleRateFormSuccess}
        />
      )}
    </div>
  );
}
