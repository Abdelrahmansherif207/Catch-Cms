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
import { useDeleteCurrency } from '../hooks/use-currencies';
import type { ApiErrorResponse } from '@/shared/api';
import type { Currency } from '../types/currency.types';

interface CurrencyDeleteDialogProps {
  currency: Currency | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function CurrencyDeleteDialog({
  currency,
  open,
  onOpenChange,
  onDeleted,
}: CurrencyDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteCurrency();

  const handleDelete = () => {
    if (!currency) return;
    deleteMutation.mutate(currency.id, {
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

  if (!currency) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('currenciesPage.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('currenciesPage.deleteConfirm', { code: currency.code })}. {t('currenciesPage.deleteWarning')}
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
            {deleteMutation.isPending ? t('currenciesPage.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
