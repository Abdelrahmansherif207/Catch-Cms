import { Barcode, MapPin, Package, Boxes } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ImagePreview } from '@/shared/components/image-preview';
import type { FulfillmentItem } from '../types/fulfillment.types';

/**
 * Full enriched-item detail (Fulfillment – Show / Packing Tasks – Show
 * contracts): product thumbnail + name + SKU + type, variant block
 * (SKU, attributes, price, stock) and the pinned location block
 * (code, name, barcode) — every field the payload carries. Falls back
 * to the bare foreign ids when the enrichment is null.
 */
export function WmsItemProductDetails({ item }: { item: FulfillmentItem }) {
  const { t } = useTranslation();

  if (!item.product) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Package className="h-4 w-4 text-muted-foreground" />
        </span>
        <span className="font-mono text-xs">#{item.product_id}</span>
        {item.product_location_id !== null && (
          <span className="text-xs text-muted-foreground">
            · loc #{item.product_location_id}
          </span>
        )}
      </div>
    );
  }

  const { product, variant, location } = item;

  return (
    <div className="flex min-w-0 items-start gap-3">
      {product.thumbnail ? (
        <ImagePreview
          src={product.thumbnail}
          alt={product.name}
          thumbnailClassName="h-10 w-10 shrink-0 rounded-lg border object-cover"
        />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Package className="h-4 w-4 text-muted-foreground" />
        </span>
      )}

      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="truncate font-medium leading-tight">{product.name}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            {product.product_type}
          </span>
        </div>

        <span className="w-fit rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
          {product.sku}
        </span>

        {variant && (
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="rounded-md bg-info-soft px-1.5 py-0.5 font-mono text-xs text-info">
              {variant.sku}
            </span>
            {variant.attributes.map((attr, index) => (
              <span
                key={index}
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {attr.attribute}: {attr.value}
              </span>
            ))}
            <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground">
              <Boxes className="h-3 w-3" />
              {t('fulfillments.variantStock')}: {variant.stock_quantity}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              {t('fulfillments.variantPrice')}: {variant.price}
            </span>
          </div>
        )}

        {location && (
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1 rounded-md bg-success-soft px-1.5 py-0.5 font-mono text-xs text-success">
              <MapPin className="h-3 w-3" />
              {location.code}
            </span>
            {location.name && (
              <span className="text-xs text-muted-foreground">{location.name}</span>
            )}
            {location.barcode && (
              <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <Barcode className="h-3 w-3" />
                {location.barcode}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
