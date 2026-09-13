import { FileImportDialog } from '@/shared/components/file-op';
import { useProductsImport } from '../hooks/use-products';

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductImportDialog({ open, onOpenChange }: ProductImportDialogProps) {
  const importApi = useProductsImport();
  return (
    <FileImportDialog ns="products" api={importApi} open={open} onOpenChange={onOpenChange} />
  );
}
