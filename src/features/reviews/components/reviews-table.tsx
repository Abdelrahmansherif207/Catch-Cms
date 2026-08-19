import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import { StarRating } from './star-rating';
import { ReviewDeleteDialog } from './review-delete-dialog';
import { useToggleApproveReview } from '../hooks/use-reviews';
import type { Review } from '../types/review.types';

interface ReviewsTableProps {
  data: Review[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function ReviewsTable({ data, isLoading, onRefresh }: ReviewsTableProps) {
  const { t } = useTranslation();
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const toggleApprove = useToggleApproveReview();

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">{t('reviews.id')}</TableHead>
              <TableHead>{t('reviews.rating')}</TableHead>
              <TableHead className="min-w-[250px]">{t('reviews.comment')}</TableHead>
              <TableHead>{t('reviews.images')}</TableHead>
              <TableHead>{t('reviews.status')}</TableHead>
              <TableHead className="w-32">{t('reviews.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {t('common.noData')}
                </TableCell>
              </TableRow>
            ) : (
              data.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="text-xs text-muted-foreground">{review.id}</TableCell>
                  <TableCell>
                    <StarRating rating={review.rating} size="sm" />
                  </TableCell>
                  <TableCell>
                    <p className="text-sm line-clamp-2 max-w-[400px]">{review.comment}</p>
                  </TableCell>
                  <TableCell>
                    {review.images && review.images.length > 0 ? (
                      <div className="flex gap-1">
                        {review.images.slice(0, 3).map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            className="h-8 w-8 rounded object-cover border"
                          />
                        ))}
                        {review.images.length > 3 && (
                          <span className="text-xs text-muted-foreground self-center">
                            +{review.images.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={review.is_approved ? 'default' : 'secondary'}
                      className={review.is_approved ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      {review.is_approved ? t('reviews.approved') : t('reviews.pending')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title={review.is_approved ? t('reviews.unapprove') : t('reviews.approve')}
                        onClick={() => toggleApprove.mutate(review.id, { onSuccess: onRefresh })}
                        disabled={toggleApprove.isPending}
                      >
                        {review.is_approved ? (
                          <ThumbsDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ThumbsUp className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(review)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {deleteTarget && (
        <ReviewDeleteDialog
          review={deleteTarget}
          open={!!deleteTarget}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
          onDeleted={onRefresh}
        />
      )}
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">ID</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Comment</TableHead>
            <TableHead>Images</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-8" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-64" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-8 w-16" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
