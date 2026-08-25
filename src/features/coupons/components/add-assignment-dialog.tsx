import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, User, X } from 'lucide-react';
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
import { useCreateAssignment } from '../hooks/use-coupons';
import type { ApiErrorResponse } from '@/shared/api';

const addAssignmentSchema = z.object({
  userId: z.number({ message: 'User is required' }),
  maxUses: z.number().int().min(1, 'Max uses must be at least 1'),
  expiresAt: z.string().optional(),
  noExpiry: z.boolean(),
})

type FormValues = z.output<typeof addAssignmentSchema>;

const defaultValues: FormValues = {
  userId: 0,
  maxUses: 1,
  expiresAt: '',
  noExpiry: true,
}

interface AddAssignmentDialogProps {
  couponId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddAssignmentDialog({
  couponId,
  open,
  onOpenChange,
  onSuccess,
}: AddAssignmentDialogProps) {

  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ id: number; name: string; email: string; avatar: string | null }>>([]);
  const [showResults, setShowResults] = useState(false);

  const createMutation = useCreateAssignment(couponId);

  const form = useForm<FormValues>({
    resolver: zodResolver(addAssignmentSchema),
    defaultValues,
  })

  const selectedUserId = form.watch('userId');
  const selectedUser = searchResults.find((u) => u.id === selectedUserId);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    try {
      const { axiosClient } = await import('@/shared/api');
      const res = await axiosClient.get('/users?search=' + encodeURIComponent(query));
      const users: Array<{ id: number; name?: string; email?: string; avatar?: string | null }> = res.data?.data?.data ?? [];
      setSearchResults(
        users.map((u) => ({
          id: u.id,
          name: u.name || u.email || 'Unknown',
          email: u.email || '',
          avatar: u.avatar || null,
        }))
      );
      setShowResults(true);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const selectUser = (user: { id: number; name: string; email: string; avatar: string | null }) => {
    form.setValue('userId', user.id);
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
  }

  const removeUser = () => {
    form.setValue('userId', 0);
  }

  const onSubmit = (values: FormValues) => {
    if (values.noExpiry) {
      values.expiresAt = '';
    }
    setServerErrors({});
    createMutation.mutate(
      {
        user_id: values.userId,
        max_uses: values.maxUses,
        expires_at: values.noExpiry ? null : values.expiresAt || null,
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
  }

  const isPending = createMutation.isPending;
  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof FormValues]?.message as string | undefined;
    const serverErr = serverErrors[field]?.[0] || serverErrors['user_id']?.[0];
    return clientErr || serverErr;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Add User Assignment</DialogTitle>
          <DialogDescription>
            Assign this coupon to a specific user.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {!selectedUser ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Search User</label>
              <div className="relative">
                <Input
                  placeholder="Type to search users..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {searching && (
                  <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {showResults && searchResults.length > 0 && (
                <div className="rounded-lg border bg-popover mt-1 max-h-48 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left"
                      onClick={() => selectUser(user)}
                    >
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                        ) : (
                          <User className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {showResults && searchResults.length === 0 && !searching && (
                <p className="text-xs text-muted-foreground mt-1">No users found</p>
              )}
              {getError('userId') && (
                <p className="text-xs text-destructive">{getError('userId')}</p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border p-2">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedUser.name}</p>
                <p className="text-xs text-muted-foreground truncate">{selectedUser.email}</p>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={removeUser}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Max Uses</label>
            <Input
              type="number"
              min={1}
              {...form.register('maxUses', { valueAsNumber: true })}
            />
            {getError('maxUses') && (
              <p className="text-xs text-destructive">{getError('maxUses')}</p>
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
              />
              <label htmlFor="noExpiry" className="text-sm font-medium">No expiry</label>
            </div>
            {!form.watch('noExpiry') && (
              <Input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                {...form.register('expiresAt')}
              />
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isPending ? 'Assigning...' : 'Assign User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
