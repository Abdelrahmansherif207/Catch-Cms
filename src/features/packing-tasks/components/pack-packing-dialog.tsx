import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, TriangleAlert } from 'lucide-react';
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
import { Textarea } from '@/shared/ui/textarea';
import { usePackPackingTask } from '../hooks/use-packing-tasks';
import { packPackingSchema, parseMaterials } from '../schemas/packing-task.schema';
import type { PackingTaskDetail } from '../types/packing-task.types';

interface PackPackingDialogProps {
  task: PackingTaskDetail;
  /** Live deficit count from the coverage guard (0/undefined = complete). */
  incompleteCoverage?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Completion form — supervisor records the locked-after-write numbers.
 * Materials is a comma-separated convenience over the server's array body.
 * The engine allows packing with empty boxes, but verify later refuses the
 * `verify_quantities` rule — surface the coverage debt BEFORE the write.
 */
export function PackPackingDialog({
  task,
  incompleteCoverage,
  open,
  onOpenChange,
}: PackPackingDialogProps) {
  const { t } = useTranslation();
  const packMutation = usePackPackingTask();

  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [materials, setMaterials] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Gated render — remounts fresh per open (no reset effect).
  if (!open) return null;

  const handleSubmit = () => {
    const parsed = packPackingSchema.safeParse({
      weight: Number(weight),
      length: Number(length),
      width: Number(width),
      height: Number(height),
      materials,
      notes,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('packingTasks.packWeightRequired'));
      return;
    }

    setError(null);
    const { weight: safeWeight, length: safeLength, width: safeWidth, height: safeHeight, materials: rawMaterials, notes: rawNotes } = parsed.data;
    packMutation.mutate(
      {
        id: task.id,
        payload: {
          weight: safeWeight,
          dimensions: {
            length: safeLength,
            width: safeWidth,
            height: safeHeight,
          },
          materials: parseMaterials(rawMaterials ?? ''),
          notes: rawNotes && rawNotes.trim().length > 0 ? rawNotes : null,
        },
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const dimensionFields: Array<{
    key: 'length' | 'width' | 'height';
    value: string;
    set: (value: string) => void;
  }> = [
    { key: 'length', value: length, set: setLength },
    { key: 'width', value: width, set: setWidth },
    { key: 'height', value: height, set: setHeight },
  ];

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            {t('packingTasks.packTitle', { id: task.id })}
          </DialogTitle>
          <DialogDescription>{t('packingTasks.packDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {typeof incompleteCoverage === 'number' && incompleteCoverage > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-warning-soft p-3 text-xs text-warning">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{t('packingTasks.packCoverageWarning', { count: incompleteCoverage })}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="pack-weight">{t('packingTasks.packWeight')}</Label>
            <Input
              id="pack-weight"
              type="number"
              step="0.01"
              min={0.01}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="2.5"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t('packingTasks.packDims')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {dimensionFields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    {t('packingTasks.packDims' + field.key.charAt(0).toUpperCase() + field.key.slice(1))}
                  </span>
                  <Input
                    type="number"
                    step="1"
                    min={0.1}
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pack-materials">{t('packingTasks.packMaterials')}</Label>
            <Input
              id="pack-materials"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder={t('packingTasks.packMaterialsPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">{t('packingTasks.packMaterialsHint')}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pack-notes">{t('packingTasks.packNotes')}</Label>
            <Textarea
              id="pack-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('packingTasks.packNotesPlaceholder')}
              rows={2}
              maxLength={2000}
            />
          </div>

          {error && <p className="text-xs text-destructive">{t(error)}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={packMutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              packMutation.isPending ||
              weight.trim().length === 0 ||
              length.trim().length === 0 ||
              width.trim().length === 0 ||
              height.trim().length === 0
            }
          >
            {packMutation.isPending ? t('packingTasks.packing') : t('packingTasks.packSubmit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
