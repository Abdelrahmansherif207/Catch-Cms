import { FileExportDialog } from '@/shared/components/file-op';
import { useExportProducts } from '../hooks/use-products';

interface ProductExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductExportDialog({ open, onOpenChange }: ProductExportDialogProps) {
  const exportApi = useExportProducts();
  return (
    <FileExportDialog ns="products" api={exportApi} open={open} onOpenChange={onOpenChange} />
  );
}
