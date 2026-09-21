import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { buttonVariants } from '@/shared/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  /** Supports typed impact text, e.g. "Delete 12 products? ..." */
  description: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  tone?: 'danger' | 'default';
}

/**
 * Standard confirmation dialog for destructive (and other consequential) actions.
 * Danger tone renders a red confirm button via the fixed --destructive token.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  loading,
  tone = 'danger',
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title ?? t('common.deleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <button
            type="button"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void onConfirm()}
            className={cn(
              buttonVariants({ variant: tone === 'danger' ? 'destructive' : 'default' })
            )}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {confirmLabel ?? t('common.delete')}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
