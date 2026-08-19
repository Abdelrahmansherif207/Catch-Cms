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
import { useDeleteStaticPageSection } from '../../hooks/use-static-pages';

interface SectionDeleteDialogProps {
  slug: string;
  sectionId: number;
  sectionTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function SectionDeleteDialog({
  slug,
  sectionId,
  sectionTitle,
  open,
  onOpenChange,
  onDeleted,
}: SectionDeleteDialogProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteStaticPageSection(slug);

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
            {t('staticPages.deleteSectionTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('staticPages.deleteSectionConfirm', { title: sectionTitle })}
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
                {t('staticPages.deleting')}
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