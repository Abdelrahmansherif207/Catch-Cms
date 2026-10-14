import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Repeat2 } from 'lucide-react';
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
import { fetchLocations, type WarehouseLocation } from '../../fulfillments/api/locations.api';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { useReallocatePickingTask } from '../hooks/use-picking-tasks';
import type { PickingTaskDetail } from '../types/picking-task.types';

interface ReallocateTaskDialogProps {
  task: PickingTaskDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MANUAL_ID = 'manual';

/**
 * Target picker backed by GET /admin/locations. KNOWN CAVEAT (live-verified):
 * location row ids are NOT guaranteed to match product_locations ids and the
 * index cannot filter by product — the server is the source of truth, so any
 * engine 422 (reallocate_product / target_inactive / …) surfaces INLINE below
 * the form, verbatim.
 */
export function ReallocateTaskDialog({ task, open, onOpenChange }: ReallocateTaskDialogProps) {
  const { t } = useTranslation();
  const reallocateMutation = useReallocatePickingTask();

  const { data: locationsResponse } = useQuery({
    queryKey: queryKeys.locations.list({ limit: 100 }),
    queryFn: () => fetchLocations({ limit: 100 }),
    enabled: open,
    staleTime: 60 * 1000,
  });
  const locations = locationsResponse?.data ?? [];

  const [mode, setMode] = useState<string>(MANUAL_ID);
  const [locationValue, setLocationValue] = useState<string>('');
  const [manualId, setManualId] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const targetId =
    mode === MANUAL_ID
      ? Number(manualId)
      : Number(locationValue) || NaN;

  const isValid = Number.isInteger(targetId) && targetId >= 1;

  const handleSubmit = () => {
    if (!isValid) {
      setError(t('pickingTasks.reallocateRequired'));
      return;
    }
    setError(null);
    reallocateMutation.mutate(
      { id: task.id, payload: { product_location_id: targetId } },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat2 className="h-5 w-5" />
            {t('pickingTasks.reallocateTitle', { id: task.id })}
          </DialogTitle>
          <DialogDescription>
            {t('pickingTasks.reallocateDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">{t('pickingTasks.currentShelf')}</span>
            {task.location ? (
              <span className="font-mono">{task.location.code}</span>
            ) : (
              <span className="font-mono text-muted-foreground">
                {t('pickingTasks.noShelf')}
              </span>
            )}
          </div>

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
              {t('pickingTasks.reallocateFromList')}
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
              {t('pickingTasks.reallocateManual')}
            </Button>
          </div>

          {mode === MANUAL_ID ? (
            <div className="space-y-1.5">
              <Label htmlFor="reallocate-manual">
                {t('pickingTasks.reallocateManualLabel')}
              </Label>
              <Input
                id="reallocate-manual"
                type="number"
                min={1}
                value={manualId}
                onChange={(event) => {
                  setManualId(event.target.value);
                  setError(null);
                }}
                placeholder={t('pickingTasks.reallocateManualPlaceholder')}
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>{t('pickingTasks.reallocateFromListLabel')}</Label>
              <Select
                value={locationValue}
                onValueChange={(v) => {
                  if (v !== null) {
                    setLocationValue(v);
                    setError(null);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('pickingTasks.reallocateFromListLabel')} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location: WarehouseLocation) => (
                    <SelectItem key={location.id} value={String(location.id)}>
                      {location.code} · {location.name}
                      {location.status !== 'active'
                        ? ' (' + t('pickingTasks.reallocateInactive') + ')'
                        : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">
            {t('pickingTasks.reallocateHint')}
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={reallocateMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={reallocateMutation.isPending || !isValid}
          >
            {reallocateMutation.isPending
              ? t('pickingTasks.reallocating')
              : t('pickingTasks.reallocateAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
