import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Loader2 } from 'lucide-react';
import { useSetBaseCurrency } from '../hooks/use-currencies';
import type { Currency } from '../types/currency.types';

interface CurrencySetBaseDialogProps {
  currency: Currency | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBaseChanged: () => void;
}

export function SetBaseCurrencyDialog({
  currency,
  open,
  onOpenChange,
  onBaseChanged,
}: CurrencySetBaseDialogProps) {
  const { t } = useTranslation();
  const setBaseMutation = useSetBaseCurrency();

  if (!currency) return null;

  const handleSwitch = () => {
    setBaseMutation.mutate(currency.id, {
      onSuccess: () => {
        onBaseChanged();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('currenciesPage.setBaseTitle')}</DialogTitle>
          <DialogDescription>{t('currenciesPage.setBaseConfirm')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={setBaseMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSwitch}
            disabled={setBaseMutation.isPending || currency.is_base}
          >
            {setBaseMutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {setBaseMutation.isPending ? t('common.loading') : t('currenciesPage.setBase')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
