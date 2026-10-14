import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus } from 'lucide-react';
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
import { usePackingStations } from '@/features/packing-stations/hooks/use-packing-stations';
import { useAssignPackingTask } from '../hooks/use-packing-tasks';
import {
  assignPackingTaskSchema,
  type AssignPackingTaskFormValues,
} from '../schemas/packing-task.schema';
import type { PackingTaskDetail, PackingTaskListItem } from '../types/packing-task.types';

interface AssignPackingTaskDialogProps {
  task: PackingTaskDetail | PackingTaskListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional `?warehouse_id` narrowing for the station list. */
  warehouseId?: number;
}

/**
 * Station picker with two modes (same family as the fulfillment assignee
 * picker): SELECT from active stations, MANUAL numeric-id fallback so the
 * action never dead-ends. The assignee is ALWAYS the authenticated caller —
 * the endpoint has no user field on purpose.
 */
export function AssignPackingTaskDialog({
  task,
  open,
  onOpenChange,
  warehouseId,
}: AssignPackingTaskDialogProps) {
  const { t } = useTranslation();
  const assignMutation = useAssignPackingTask();
  const [error, setError] = useState<string | null>(null);
  const [useManual, setUseManual] = useState(false);
  const [manualId, setManualId] = useState('');
  const [selectedId, setSelectedId] = useState('');

  const { data: stationsResponse } = usePackingStations({
    status: 'active',
    warehouseId,
    limit: 100,
  });
  const stations = stationsResponse?.data ?? [];

  const handleSubmit = () => {
    const raw = useManual ? manualId.trim() : selectedId;

    // Reserve the select mode for ids that actually resolve server-side;
    // manual entries go through the same zod gate either way.
    if (!useManual && stations.length > 0 && !stations.some((s) => String(s.id) === raw)) {
      setError(t('packingTasks.assignStationRequired'));
      return;
    }

    const parsed = assignPackingTaskSchema.safeParse({
      station_id: Number(raw),
    } satisfies Partial<AssignPackingTaskFormValues>);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('packingTasks.assignStationRequired'));
      return;
    }

    setError(null);
    assignMutation.mutate(
      { id: task.id, payload: parsed.data },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  // Gated render — fresh internal state per open (no reset effect).
  if (!open) return null;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('packingTasks.assignTitle', { id: task.id })}
          </DialogTitle>
          <DialogDescription>{t('packingTasks.assignDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {!useManual ? (
            <>
              <div className="space-y-1.5">
                <Label>{t('packingTasks.assignStation')}</Label>
                <Select value={selectedId} onValueChange={(v) => { if (v !== null) setSelectedId(v); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('packingTasks.assignStationPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (
                      <SelectItem key={station.id} value={String(station.id)}>
                        {station.code} — {station.name}
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
                {t('packingTasks.assignUseManual')}
              </button>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="assign-station-id">{t('packingTasks.assignManualLabel')}</Label>
                <Input
                  id="assign-station-id"
                  type="number"
                  min={1}
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder={t('packingTasks.assignManualPlaceholder')}
                />
                <p className="text-xs text-muted-foreground">
                  {t('packingTasks.assignManualHint')}
                </p>
              </div>
              <button
                type="button"
                className="text-xs text-muted-foreground underline"
                onClick={() => setUseManual(false)}
              >
                {t('packingTasks.assignStation')}
              </button>
            </>
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
            onClick={handleSubmit}
            disabled={
              assignMutation.isPending ||
              (useManual ? manualId.trim().length === 0 : selectedId.length === 0)
            }
          >
            {assignMutation.isPending
              ? t('packingTasks.assigning')
              : t('packingTasks.assignActionSubmit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
