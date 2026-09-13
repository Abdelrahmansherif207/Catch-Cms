import { FileImportDialog } from '@/shared/components/file-op';
import { useBrandsImport } from '../hooks/use-brands';

interface BrandImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BrandImportDialog({ open, onOpenChange }: BrandImportDialogProps) {
  const importApi = useBrandsImport();
  return <FileImportDialog ns="brands" api={importApi} open={open} onOpenChange={onOpenChange} />;
}
