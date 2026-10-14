import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { fetchUsers } from '@/features/users/api/users.api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { queryKeys } from '@/shared/lib/query-keys';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useAssignFulfillment } from '../hooks/use-fulfillments';
import type { FulfillmentDetail } from '../types/fulfillment.types';

interface AssignFulfillmentDialogProps {
  fulfillment: FulfillmentDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Assignee picker with two modes:
 * - SELECT  — from the admin-users list, only when the caller's raw login
 *             grants include `view-admins` (NOT can(): the client-side
 *             super_admin role bypasses checks, but the backend still
 *             enforces the /users pipe — same family as packing operators).
 * - MANUAL  — numeric user id fallback so the action never dead-ends.
 * A role holding the users permission can still switch to manual entries.
 */
export function AssignFulfillmentDialog({
  fulfillment,
  open,
  onOpenChange,
  onSuccess,
}: AssignFulfillmentDialogProps) {
  const { t } = useTranslation();
  const assignMutation = useAssignFulfillment();
  const [error, setError] = useState<string | undefined>(undefined);
  const [useManual, setUseManual] = useState(false);
  const [manualId, setManualId] = useState('');
  const [selectedId, setSelectedId] = useState('');

  const rawPermissions = useAuthStore((s) => s.user?.permissions ?? []);
  const canListUsers = rawPermissions.includes(PERMISSIONS.users.viewAdmins);

  const { data: usersResponse } = useQuery({
    queryKey: queryKeys.users.list({ admins: true, perPage: 100 }),
    queryFn: () => fetchUsers({ admins: true, perPage: 100 }),
    enabled: open && canListUsers && !useManual,
    staleTime: 60 * 1000,
  });
  const operators = canListUsers ? (usersResponse?.data?.data ?? []) : [];

  const handleAssign = () => {
    if (!fulfillment) return;
    const value = useManual ? manualId.trim() : selectedId;
    const userId = Number(value);
    if (!value || !Number.isInteger(userId) || userId <= 0) {
      setError(t('fulfillments.assignUserRequired'));
      return;
    }
    assignMutation.mutate(
      { id: fulfillment.id, payload: { user_id: userId } },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess();
        },
      }
    );
  };

  const pending = assignMutation.isPending;

  // Gated render — remounts fresh per open (no reset effect).
  if (!open) return null;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('fulfillments.assignTitle')}</DialogTitle>
          <DialogDescription>
            {t('fulfillments.assignDescription', {
              number: fulfillment?.fulfillment_number ?? '',
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {canListUsers && !useManual ? (
            <>
              <div className="space-y-1.5">
                <Label>{t('fulfillments.assigneeSelect')}</Label>
                <Select value={selectedId} onValueChange={(v) => { if (v !== null) setSelectedId(v); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('fulfillments.assigneeSelect')} />
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
              <button
                type="button"
                className="text-xs text-muted-foreground underline"
                onClick={() => setUseManual(true)}
              >
                {t('fulfillments.assignUseManual')}
              </button>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="assign-user-id">{t('fulfillments.assigneeManual')}</Label>
                <Input
                  id="assign-user-id"
                  type="number"
                  min={1}
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="7"
                />
                <p className="text-xs text-muted-foreground">
                  {t('fulfillments.assigneeManualHint')}
                </p>
              </div>
              {canListUsers && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline"
                  onClick={() => setUseManual(false)}
                >
                  {t('fulfillments.assignUseSelect')}
                </button>
              )}
            </>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={handleAssign} disabled={pending}>
            {pending ? t('fulfillments.assigning') : t('fulfillments.assignAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
