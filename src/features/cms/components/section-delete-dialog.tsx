import { useTranslation } from 'react-i18next';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { useDeleteSection } from '../hooks/use-sections';

interface SectionDeleteDialogProps {
  sectionId: number;
  sectionTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function SectionDeleteDialog({
  sectionId,
  sectionTitle,
  open,
  onOpenChange,
  onDeleted,
}: SectionDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteSection();

  const handleDelete = () => {
    deleteMutation.mutate(sectionId, {
      onSuccess: () => {
        onOpenChange(false);
        onDeleted();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t('sections.deleteTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('sections.deleteDescription', { title: sectionTitle })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
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
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t('sections.deleting')}
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
