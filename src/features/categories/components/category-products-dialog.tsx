import { useTranslation } from 'react-i18next';
import { Loader2, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Badge } from '@/shared/ui/badge';
import { useCategory } from '../hooks/use-categories';

interface CategoryProductsDialogProps {
  categoryId: number;
  categoryName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryProductsDialog({
  categoryId,
  categoryName,
  open,
  onOpenChange,
}: CategoryProductsDialogProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useCategory(open ? categoryId : 0);
  const products = data?.data?.products;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('categories.products')} — {categoryName}</DialogTitle>
          <DialogDescription>
            {t('categories.productsCount', { count: products?.length ?? 0 })}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : products && products.length > 0 ? (
          <div className="space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                {product.image?.thumbnail ? (
                  <img
                    src={product.image.thumbnail}
                    alt={product.name}
                    className="h-12 w-12 shrink-0 rounded-lg border object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="truncate text-xs text-muted-foreground font-mono">
                    /{product.slug}
                  </p>
                </div>
                <Badge
                  variant={product.status ? 'default' : 'secondary'}
                  className="shrink-0"
                >
                  {product.status ? t('products.active') : t('products.inactive')}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Package className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t('categories.noProducts')}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
