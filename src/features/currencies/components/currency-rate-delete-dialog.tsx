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
import { useDeleteExchangeRate } from '../hooks/use-currencies';
import type { ApiErrorResponse } from '@/shared/api';
import type { ExchangeRate } from '../types/currency.types';

interface CurrencyRateDeleteDialogProps {
  rate: ExchangeRate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function CurrencyRateDeleteDialog({
  rate,
  open,
  onOpenChange,
  onDeleted,
}: CurrencyRateDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteExchangeRate();

  const handleDelete = () => {
    if (!rate) return;
    deleteMutation.mutate(rate.id, {
      onSuccess: () => {
        onDeleted();
        onOpenChange(false);
      },
      onError: (error: unknown) => {
        const apiError = error as ApiErrorResponse;
        if (apiError.status === 409) {
          // message already shown via handleApiError toast
        }
      },
    });
  };

  if (!rate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('currencyRates.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('currencyRates.deleteConfirm', {
              date: new Date(rate.effective_date).toLocaleDateString(),
            })}{' '}
            {t('currencyRates.deleteWarning')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? t('common.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
