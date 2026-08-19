import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { toast } from 'sonner';
import { useDeleteAssignment } from '../hooks/use-coupons';
import type { CouponAssignment } from '../types/coupon.types';

interface DeleteAssignmentDialogProps {
  couponId: number;
  assignment: CouponAssignment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteAssignmentDialog({
  couponId,
  assignment,
  open,
  onOpenChange,
  onSuccess,
}: DeleteAssignmentDialogProps) {

  const deleteMutation = useDeleteAssignment(couponId);
  const [apiConflict, setApiConflict] = useState(false);

  const isBlocked = assignment.used > 0;

  const handleDelete = () => {
    setApiConflict(false);
    deleteMutation.mutate(assignment.id, {
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        toast.success('Assignment removed successfully', {
          action: {
            label: 'Undo',
            onClick: () => onSuccess(),
          },
        });
      },
      onError: (error: unknown) => {
        const apiError = error as { status?: number; message?: string };
        if (apiError?.status === 409) {
          setApiConflict(true);
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Assignment</DialogTitle>
          <DialogDescription>
            Remove coupon access for this user.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-lg border bg-muted/50 p-3 space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">User</span>
              <span className="font-medium">{assignment.user_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Max Uses</span>
              <span>{assignment.max_uses}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Used</span>
              <span>{assignment.used}</span>
            </div>
          </div>

          {isBlocked && (
            <div className="rounded-lg border bg-red-50 border-red-200 p-3 text-sm text-red-700">
              Cannot delete \u2014 user has already used this coupon ({assignment.used} time{assignment.used !== 1 ? 's' : ''}).
            </div>
          )}

          {apiConflict && (
            <div className="rounded-lg border bg-red-50 border-red-200 p-3 text-sm text-red-700">
              Cannot delete assignment with usage history.
            </div>
          )}

          {!isBlocked && !apiConflict && (
            <p className="text-sm text-muted-foreground">
              Are you sure you want to remove this assignment?
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isBlocked || deleteMutation.isPending}
            title={isBlocked ? 'Cannot delete \u2014 user has already used this coupon' : ''}
          >
            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
