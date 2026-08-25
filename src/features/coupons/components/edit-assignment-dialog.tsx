import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Input } from '@/shared/ui/input';
import { useUpdateAssignment } from '../hooks/use-coupons';
import type { CouponAssignment } from '../types/coupon.types';
import type { ApiErrorResponse } from '@/shared/api';

const editAssignmentSchema = z.object({
  maxUses: z.number().int().min(1, 'Max uses must be at least 1'),
  expiresAt: z.string().optional(),
  noExpiry: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.noExpiry === false && !data.expiresAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['expiresAt'],
      message: 'Expiry date is required when no expiry is off',
    });
  }
});

type FormValues = z.output<typeof editAssignmentSchema>;

interface EditAssignmentDialogProps {
  couponId: number;
  assignment: CouponAssignment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditAssignmentDialog({
  couponId,
  assignment,
  open,
  onOpenChange,
  onSuccess,
}: EditAssignmentDialogProps) {

  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const updateMutation = useUpdateAssignment(couponId);

  const form = useForm<FormValues>({
    resolver: zodResolver(editAssignmentSchema),
    defaultValues: {
      maxUses: assignment.max_uses,
      expiresAt: assignment.expires_at ? assignment.expires_at.split('T')[0] : '',
      noExpiry: !assignment.expires_at,
    },
  });

  const watchedMaxUses = form.watch('maxUses');

  const onSubmit = (values: FormValues) => {
    if (values.maxUses < assignment.used) {
      setServerErrors({ maxUses: ['max_uses cannot be less than current usage count'] });
      return;
    }
    setServerErrors({});
    updateMutation.mutate(
      {
        id: assignment.id,
        data: {
          max_uses: values.maxUses,
          expires_at: values.noExpiry ? null : values.expiresAt || null,
        },
      },
      {
        onSuccess,
        onError: (error: unknown) => {
          const apiError = error as ApiErrorResponse;
          if (apiError?.status === 422 && apiError.errors) {
            setServerErrors(apiError.errors);
          }
        },
      }
    );
  };

  const isPending = updateMutation.isPending;
  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof FormValues]?.message as string | undefined;
    const serverErr = serverErrors[field]?.[0];
    return clientErr || serverErr;
  };

  const maxUsesError = watchedMaxUses < assignment.used
    ? 'max_uses cannot be less than current usage count'
    : getError('maxUses');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
          <DialogDescription>
            Update usage quota and expiry for {assignment.user_name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Max Uses</label>
            <Input
              type="number"
              min={1}
              {...form.register('maxUses', { valueAsNumber: true })}
              disabled={isPending}
            />
            {maxUsesError && (
              <p className="text-xs text-destructive">{maxUsesError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="noExpiry"
                checked={form.watch('noExpiry')}
                onChange={(e) => form.setValue('noExpiry', e.target.checked)}
                className="h-4 w-4"
                disabled={isPending}
              />
              <label htmlFor="noExpiry" className="text-sm font-medium">No expiry</label>
            </div>
            {!form.watch('noExpiry') && (
              <Input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                {...form.register('expiresAt')}
                disabled={isPending}
              />
            )}
            {getError('expiresAt') && (
              <p className="text-xs text-destructive">{getError('expiresAt')}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
