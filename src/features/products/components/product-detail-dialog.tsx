import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Badge } from '@/shared/ui/badge';
import { ImagePreview } from '@/shared/components/image-preview';
import { useProduct } from '../hooks/use-products';
import type { Product } from '../types/product.types';

interface ProductDetailDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailDialog({
  product,
  open,
  onOpenChange,
}: ProductDetailDialogProps) {
  const { t } = useTranslation();
  const { data: detailData, isLoading } = useProduct(open ? product.id : 0);
  const detail = detailData?.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            /{product.slug}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : detail ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('products.sku')}</p>
                <p className="font-mono text-sm">{detail.sku}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('products.status')}</p>
                <Badge variant={detail.status ? 'default' : 'secondary'}>
                  {detail.status ? t('products.active') : t('products.inactive')}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('products.price')}</p>
                <p className="font-medium">{Number(detail.current_price).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('products.stock')}</p>
                <p className={detail.in_stock ? 'text-green-600' : 'text-red-600'}>
                  {detail.available_stock} ({t('products.sold')}: {detail.sold_quantity})
                </p>
              </div>
              {detail.price_after_discount && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('products.priceAfterDiscount')}</p>
                  <p className="font-medium text-green-600">
                    {Number(detail.price_after_discount).toFixed(2)}
                  </p>
                </div>
              )}
              {detail.price_after_flash_sale && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('products.priceAfterFlashSale')}</p>
                  <p className="font-medium text-orange-600">
                    {Number(detail.price_after_flash_sale).toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            {detail.categories && detail.categories.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('products.categories')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {detail.categories.map((cat) => (
                    <Badge key={cat.id} variant="outline">
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground mb-1">{t('products.description')}</p>
              <p className="text-sm">{detail.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('products.dimensions')}</p>
                <p className="text-sm">
                  {detail.height} x {detail.width} x {detail.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('products.weight')}</p>
                <p className="text-sm">{detail.weight}</p>
              </div>
            </div>

            {detail.images && detail.images.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">{t('products.images')}</p>
                <div className="flex flex-wrap gap-2">
                  {detail.images.map((img, i) => (
                    <ImagePreview
                      key={i}
                      src={img}
                      alt={`${product.name} ${i + 1}`}
                      thumbnailClassName="h-20 w-20 rounded-lg border object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">{t('common.noData')}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
