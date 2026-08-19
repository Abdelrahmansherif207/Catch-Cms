import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useDeleteAllProducts } from '../hooks/use-products';

interface ProductDeleteAllDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDeleteAllDialog({ open, onOpenChange }: ProductDeleteAllDialogProps) {
  const { t } = useTranslation();
  const [confirmText, setConfirmText] = useState('');
  const deleteMutation = useDeleteAllProducts();
  const confirmed = confirmText === 'DELETE';

  const handleDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        onOpenChange(false);
        setConfirmText('');
      },
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !deleteMutation.isPending) {
      setConfirmText('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>{t('products.deleteAllTitle')}</DialogTitle>
              <DialogDescription>{t('products.deleteAllDesc')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {t('products.deleteAllWarning')}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('products.deleteAllConfirmLabel')}
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!confirmed || deleteMutation.isPending}
          >
            {deleteMutation.isPending ? t('products.deleting') : t('products.deleteAllBtn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
