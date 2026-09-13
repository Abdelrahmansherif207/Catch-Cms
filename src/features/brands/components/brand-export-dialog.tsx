import { FileExportDialog } from '@/shared/components/file-op';
import { useBrandsExport } from '../hooks/use-brands';

interface BrandExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BrandExportDialog({ open, onOpenChange }: BrandExportDialogProps) {
  const exportApi = useBrandsExport();
  return <FileExportDialog ns="brands" api={exportApi} open={open} onOpenChange={onOpenChange} />;
}
