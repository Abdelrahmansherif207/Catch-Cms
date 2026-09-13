import { FileExportDialog } from '@/shared/components/file-op';
import { useCategoriesExport } from '../hooks/use-categories';

interface CategoryExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryExportDialog({ open, onOpenChange }: CategoryExportDialogProps) {
  const exportApi = useCategoriesExport();
  return (
    <FileExportDialog ns="categories" api={exportApi} open={open} onOpenChange={onOpenChange} />
  );
}
