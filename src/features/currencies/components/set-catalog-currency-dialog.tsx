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
import { useSetCatalogCurrency } from '../hooks/use-currencies';
import type { Currency } from '../types/currency.types';

interface SetCatalogCurrencyDialogProps {
  currency: Currency | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCatalogChanged: () => void;
}

export function SetCatalogCurrencyDialog({
  currency,
  open,
  onOpenChange,
  onCatalogChanged,
}: SetCatalogCurrencyDialogProps) {
  const { t } = useTranslation();
  const setCatalogMutation = useSetCatalogCurrency();

  if (!currency) return null;

  const handleSwitch = () => {
    setCatalogMutation.mutate(currency.id, {
      onSuccess: () => {
        onCatalogChanged();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('currencies.setCatalogTitle')}</DialogTitle>
          <DialogDescription>{t('currencies.setCatalogConfirm')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={setCatalogMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSwitch}
            disabled={setCatalogMutation.isPending || currency.is_catalog}
          >
            {setCatalogMutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {setCatalogMutation.isPending ? t('common.loading') : t('currencies.setCatalog')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
