import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Star,
  Zap,
  Tag,
  Package,
  Ruler,
  Weight,
  Truck,
  Clock,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { Skeleton } from '@/shared/ui/skeleton';
import { ImagePreview } from '@/shared/components/image-preview';
import { useProduct } from '../hooks/use-products';
import { ProductDeleteDialog } from '../components/product-delete-dialog';
import { productRoutes } from '../routes/product.routes';
import { useLanguage } from '@/shared/hooks/use-language';

function getLocalizedValue(value: string, language: string): string {
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed[language] || parsed.en || value;
    }
    return value;
  } catch {
    return value;
  }
}

function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [selected, setSelected] = useState(0);

  return (
    <div className="space-y-3">
      <ImagePreview
        src={images[selected]}
        alt={`${alt} ${selected + 1}`}
        thumbnailClassName="w-full aspect-square rounded-xl border object-cover"
      />
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={`shrink-0 rounded-lg border-2 overflow-hidden transition-colors ${
                i === selected ? 'border-primary' : 'border-transparent hover:border-muted'
              }`}
            >
              <img src={img} alt={`${alt} ${i + 1}`} className="h-16 w-16 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
          }`}
        />
      ))}
      <span className="ml-1.5 text-sm text-muted-foreground">({rating}/5)</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    </div>
  );
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading } = useProduct(Number(id));
  const detail = data?.data;

  const handleDeleted = () => {
    navigate(productRoutes.list);
  };

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">{t('common.noData')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(productRoutes.list)}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const productName = getLocalizedValue(detail.name, language);
  const productDescription = getLocalizedValue(detail.description, language);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(productRoutes.list)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(productRoutes.edit(detail.id))}>
            <Pencil className="mr-2 h-4 w-4" />
            {t('common.edit')}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('common.delete')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ImageGallery images={detail.images} alt={productName} />

        <div className="space-y-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{productName}</h1>
              <Badge variant={detail.status ? 'default' : 'secondary'} className="shrink-0">
                {detail.status ? t('products.active') : t('products.inactive')}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground font-mono">/{detail.slug}</p>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">
              {Number(detail.current_price).toFixed(2)}
            </span>
            {Number(detail.price) !== Number(detail.current_price) && (
              <span className="text-xl text-muted-foreground line-through">
                {Number(detail.price).toFixed(2)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4">
            <InfoItem icon={<Package className="h-4 w-4" />} label={t('products.sku')} value={detail.sku} />
            <InfoItem
              icon={<Clock className="h-4 w-4" />}
              label={t('products.type')}
              value={detail.product_type ?? '-'}
            />
            <InfoItem
              icon={detail.in_stock ? <span className="h-4 w-4 text-green-500">&#9679;</span> : <span className="h-4 w-4 text-red-500">&#9679;</span>}
              label={t('products.stock')}
              value={`${detail.available_stock} (${t('products.sold')}: ${detail.sold_quantity})`}
            />
            <InfoItem
              icon={<Ruler className="h-4 w-4" />}
              label={t('products.dimensions')}
              value={`${detail.height} x ${detail.width} x ${detail.length}`}
            />
            <InfoItem icon={<Weight className="h-4 w-4" />} label={t('products.weight')} value={`${detail.weight}g`} />
            <InfoItem
              icon={<Truck className="h-4 w-4" />}
              label={t('products.fastShipping')}
              value={detail.is_fast_shipping_available ? t('common.yes') : t('common.no')}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-lg border p-5">
            <h2 className="text-lg font-semibold mb-3">{t('products.description')}</h2>
            <p className="text-muted-foreground leading-relaxed">{productDescription}</p>
          </section>

          {detail.categories && detail.categories.length > 0 && (
            <section className="rounded-lg border p-5">
              <h2 className="text-lg font-semibold mb-3">{t('products.categories')}</h2>
              <div className="flex flex-wrap gap-2">
                {detail.categories.map((cat) => (
                  <Badge key={cat.id} variant="outline">{cat.name}</Badge>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-lg border p-5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {t('products.discountInfo')}
            </h2>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <Kv label={t('products.regularPrice')} value={Number(detail.price).toFixed(2)} />
              <Kv label={t('products.price')} value={Number(detail.current_price).toFixed(2)} />
              <Kv label={t('products.priceAfterDiscount')} value={detail.price_after_discount ? Number(detail.price_after_discount).toFixed(2) : '-'} />
              <Kv label={t('products.priceAfterFlashSale')} value={detail.price_after_flash_sale ? Number(detail.price_after_flash_sale).toFixed(2) : '-'} />
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <Kv label={t('products.hasDiscount')} value={detail.has_discount ? t('common.yes') : t('common.no')} />
              <Kv label={t('products.discountValid')} value={detail.discount_valid === undefined ? 'N/A' : detail.discount_valid ? t('common.yes') : t('common.no')} />
              <Kv label={t('products.discountType')} value={detail.discount_type ?? '-'} />
              <Kv label={t('products.discountAmount')} value={detail.discount_amount ? Number(detail.discount_amount).toFixed(2) : '-'} />
              <Kv label={t('products.startDate')} value={detail.start_date ?? '-'} />
              <Kv label={t('products.endDate')} value={detail.end_date ?? '-'} />
            </div>

            <Separator className="my-4" />

            <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Zap className="h-4 w-4" />
              {t('products.flashSale')}
            </h3>

            <Kv label={t('products.hasFlashSale')} value={detail.has_flash_sale ? t('common.yes') : t('common.no')} className="mb-3" />

            {detail.flash_sales && detail.flash_sales.length > 0 ? (
              <div className="space-y-3">
                {detail.flash_sales.map((fs) => {
                  const fsTitle = getLocalizedValue(fs.title, language);
                  return (
                    <div key={fs.id} className="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20 p-3 space-y-1.5">
                      <p className="font-medium">{fsTitle}</p>
                      <p className="text-sm text-muted-foreground">{fs.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-orange-600 font-medium">
                          {fs.type}: {fs.discount}
                          {fs.max_discount_amount ? ` (max ${fs.max_discount_amount})` : ''}
                        </span>
                        <Badge variant={fs.is_valid ? 'default' : 'secondary'} className={fs.is_valid ? 'bg-orange-500 hover:bg-orange-600' : ''}>
                          {fs.is_valid ? t('products.active') : t('products.inactive')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {fs.start_date} → {fs.end_date}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">{t('common.noData')}</p>
            )}
          </section>

          {detail.reviews && detail.reviews.length > 0 && (
            <section className="rounded-lg border p-5">
              <h2 className="text-lg font-semibold mb-4">{t('products.reviews')}</h2>
              <div className="space-y-4">
                {detail.reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <StarRating rating={review.rating} />
                    <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {review.images.map((img, i) => (
                          <ImagePreview
                            key={i}
                            src={img}
                            alt={`Review image ${i + 1}`}
                            thumbnailClassName="h-14 w-14 rounded-lg border object-cover"
                          />
                        ))}
                      </div>
                    )}
                    {review.is_approved && (
                      <Badge variant="outline" className="mt-2 text-xs text-green-600 border-green-300">
                        {t('products.approved')}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          {detail.brands && detail.brands.length > 0 && (
            <section className="rounded-lg border p-5">
              <h2 className="text-lg font-semibold mb-3">{t('products.brand')}</h2>
              {detail.brands.map((brand) => (
                <div key={brand.id} className="space-y-2">
                  {brand.image?.desktop && (
                    <img
                      src={brand.image.desktop}
                      alt={getLocalizedValue(brand.name, language)}
                      className="h-16 rounded-lg border object-contain bg-white"
                    />
                  )}
                  <p className="font-medium">{getLocalizedValue(brand.name, language)}</p>
                  <p className="text-sm text-muted-foreground">{brand.details}</p>
                </div>
              ))}
            </section>
          )}

          <section className="rounded-lg border p-5">
            <h2 className="text-lg font-semibold mb-3">{t('products.createdAt')}</h2>
            <p className="text-sm text-muted-foreground">{detail.created_at}</p>
          </section>
        </div>
      </div>

      {detail.related_products && detail.related_products.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">{t('products.relatedProducts')}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {detail.related_products.map((related) => {
              const relatedName = getLocalizedValue(related.name, language);
              return (
                <button
                  key={related.id}
                  type="button"
                  onClick={() => navigate(productRoutes.detail(related.id))}
                  className="rounded-lg border bg-card text-left hover:shadow-md transition-shadow overflow-hidden"
                >
                  {related.images && related.images.length > 0 && (
                    <img
                      src={related.images[0]}
                      alt={relatedName}
                      className="aspect-square w-full object-cover"
                    />
                  )}
                  <div className="p-3 space-y-1">
                    <p className="font-medium text-sm truncate">{relatedName}</p>
                    <p className="text-sm font-semibold">
                      {related.price_after_flash_sale
                        ? Number(related.price_after_flash_sale).toFixed(2)
                        : Number(related.current_price).toFixed(2)}
                    </p>
                    <div className="flex items-center gap-1">
                      {related.has_discount && <Tag className="h-3 w-3 text-amber-500" />}
                      {related.has_flash_sale && <Zap className="h-3 w-3 text-orange-500" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {detail.banners && detail.banners.length > 0 && (
        <section className="rounded-lg border p-5">
          <h2 className="text-lg font-semibold mb-3">{t('products.banners')}</h2>
          <div className="space-y-3">
            {detail.banners.map((banner) => (
              <div key={banner.id} className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0">
                {banner.image?.desktop && (
                  <img
                    src={banner.image.desktop}
                    alt={banner.title}
                    className="h-14 w-20 rounded-lg object-cover shrink-0"
                  />
                )}
                <div>
                  <p className="font-medium text-sm">{banner.title}</p>
                  <p className="text-xs text-muted-foreground">{banner.description}</p>
                </div>
                <Badge variant={banner.status ? 'default' : 'secondary'} className="ml-auto shrink-0">
                  {banner.status ? t('products.active') : t('products.inactive')}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {detail.sliders && detail.sliders.length > 0 && (
        <section className="rounded-lg border p-5">
          <h2 className="text-lg font-semibold mb-3">{t('products.sliders')}</h2>
          <div className="space-y-3">
            {detail.sliders.map((slider) => (
              <div key={slider.id} className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0">
                {slider.image?.desktop && (
                  <img
                    src={slider.image.desktop}
                    alt={slider.title.en}
                    className="h-14 w-20 rounded-lg object-cover shrink-0"
                  />
                )}
                <div>
                  <p className="font-medium text-sm">{slider.title.en}</p>
                  <p className="text-xs text-muted-foreground">/{slider.slug}</p>
                </div>
                <Badge variant={slider.status ? 'default' : 'secondary'} className="ml-auto shrink-0">
                  {slider.status ? t('products.active') : t('products.inactive')}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      <ProductDeleteDialog
        productId={detail.id}
        productName={productName}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={handleDeleted}
      />
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function Kv({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
