import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { StarRating } from './star-rating';
import { useDeleteReview } from '../hooks/use-reviews';
import type { Review } from '../types/review.types';

interface ReviewDeleteDialogProps {
  review: Review;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function ReviewDeleteDialog({ review, open, onOpenChange, onDeleted }: ReviewDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteReview();

  const handleDelete = () => {
    deleteMutation.mutate(review.id, {
      onSuccess: () => {
        onOpenChange(false);
        onDeleted();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('reviews.deleteTitle')}</DialogTitle>
          <DialogDescription>{t('reviews.deleteWarning')}</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <StarRating rating={review.rating} />
          <p className="text-sm text-muted-foreground line-clamp-3">{review.comment}</p>
        </div>

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
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.deleting')}
              </>
            ) : (
              t('common.delete')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
