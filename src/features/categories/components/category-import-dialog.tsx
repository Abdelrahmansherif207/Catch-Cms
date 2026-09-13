import { FileImportDialog } from '@/shared/components/file-op';
import { useCategoriesImport } from '../hooks/use-categories';

interface CategoryImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryImportDialog({ open, onOpenChange }: CategoryImportDialogProps) {
  const importApi = useCategoriesImport();
  return (
    <FileImportDialog ns="categories" api={importApi} open={open} onOpenChange={onOpenChange} />
  );
}
