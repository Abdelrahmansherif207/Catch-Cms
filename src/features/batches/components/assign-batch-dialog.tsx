import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { UserCheck } from 'lucide-react';
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
import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { fetchUsers } from '@/features/users/api/users.api';
import { useProfile } from '@/features/profile';
import { queryKeys } from '@/shared/lib/query-keys';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useAssignBatch } from '../hooks/use-batches';
import { assignBatchSchema } from '../schemas/batch.schema';
import type { BatchDetail } from '../types/batch.types';

interface AssignBatchDialogProps {
  batch: BatchDetail;
  /** Raw-grants batch.manage — controls the privileged Take over toggle. */
  canReassign: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MANUAL_ID = 'manual';

/**
 * Assignee picker: dropdown from the users list, manual id fallback
 * (same keep-suppression pattern as assign-fulfillment), and a one-tap
 * "Assign to me". The Take over (reassign) toggle is manager-only —
 * a contested batch without it 409s with the winner kept.
 */
export function AssignBatchDialog({
  batch,
  canReassign,
  open,
  onOpenChange,
}: AssignBatchDialogProps) {
  const { t } = useTranslation();
  const assignMutation = useAssignBatch();
  const rawPermissions = useAuthStore((s) => s.user?.permissions ?? []);
  // "Assign to me" resolves via /me — the auth store's user shape has no id.
  const { data: profileResponse } = useProfile();
  const currentUserId = profileResponse?.data?.id ?? null;
  // Raw-grants gate — can() bypasses checks for super_admin, but the
  // backend /users pipe does NOT: same suppression as assign-fulfillment.
  const canListUsers = rawPermissions.includes(PERMISSIONS.users.viewAdmins);

  const { data: usersResponse } = useQuery({
    queryKey: queryKeys.users.list({ admins: true, perPage: 100 }),
    queryFn: () => fetchUsers({ admins: true, perPage: 100 }),
    enabled: open && canListUsers,
    staleTime: 60 * 1000,
  });
  const operators = canListUsers ? (usersResponse?.data?.data ?? []) : [];

  const [mode, setMode] = useState<string>('select');
  const [userValue, setUserValue] = useState('');
  const [manualId, setManualId] = useState('');
  const [reassign, setReassign] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const targetId =
    mode === MANUAL_ID
      ? Number(manualId)
      : Number(userValue) || NaN;

  const handleSubmit = (explicitId?: number) => {
    const parsed = assignBatchSchema.safeParse({
      user_id: explicitId ?? targetId,
      reassign: reassign || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('batches.assigneeRequired'));
      return;
    }
    setError(null);
    assignMutation.mutate(
      { id: batch.id, payload: parsed.data },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            {t('batches.assignTitle', { number: batch.batch_number })}
          </DialogTitle>
          <DialogDescription>
            {batch.assigned_to !== null
              ? t('batches.assignOccupied', { id: batch.assigned_to })
              : t('batches.assignDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {currentUserId !== null && (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => handleSubmit(currentUserId)}
              disabled={assignMutation.isPending}
            >
              {t('batches.assignToMe')}
            </Button>
          )}

          {canListUsers && (
            <div className="flex gap-2 rounded-lg border bg-muted/30 p-1">
              <Button
                type="button"
                variant={mode !== MANUAL_ID ? 'secondary' : 'ghost'}
                size="sm"
                className="flex-1"
                onClick={() => {
                  setMode('select');
                  setError(null);
                }}
              >
                {t('batches.assignFromList')}
              </Button>
              <Button
                type="button"
                variant={mode === MANUAL_ID ? 'secondary' : 'ghost'}
                size="sm"
                className="flex-1"
                onClick={() => {
                  setMode(MANUAL_ID);
                  setError(null);
                }}
              >
                {t('batches.assignManual')}
              </Button>
            </div>
          )}

          {mode === MANUAL_ID || !canListUsers ? (
            <div className="space-y-1.5">
              <Label htmlFor="assign-manual">{t('batches.assigneeManualLabel')}</Label>
              <Input
                id="assign-manual"
                type="number"
                min={1}
                value={manualId}
                onChange={(event) => {
                  setManualId(event.target.value);
                  setError(null);
                }}
                placeholder={t('batches.assigneeManualPlaceholder')}
              />
            </div>
          ) : canListUsers ? (
            <div className="space-y-1.5">
              <Label>{t('batches.assigneeSelectLabel')}</Label>
              <Select
                value={userValue}
                onValueChange={(v) => {
                  if (v !== null) {
                    setUserValue(v);
                    setError(null);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('batches.assigneeSelectLabel')} />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((operator) => (
                    <SelectItem key={operator.id} value={String(operator.id)}>
                      {operator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {t('batches.assigneeListUnavailable')}
            </p>
          )}

          {canReassign && (
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
              <span>
                <span className="block text-sm font-medium">
                  {t('batches.reassignTitle')}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {t('batches.reassignHint')}
                </span>
              </span>
              <Switch checked={reassign} onCheckedChange={setReassign} />
            </label>
          )}

          {error && <p className="text-xs text-destructive">{t(error)}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={assignMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit()}
            disabled={assignMutation.isPending}
          >
            {assignMutation.isPending
              ? t('batches.assigning')
              : reassign
                ? t('batches.reassignAction')
                : t('batches.assignAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
