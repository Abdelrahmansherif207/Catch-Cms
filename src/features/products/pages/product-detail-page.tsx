import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Pencil,
  Trash2,
  Star,
  Zap,
  Tag,
  Package,
  Ruler,
  Weight,
  Clock,
  FileText,
  ImageIcon,
  Store,
  Layers,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { PageBackHeader } from '@/shared/components/page-header';
import { DetailHero } from '@/shared/components/detail-hero';
import { CardSection } from '@/shared/components/card-section';
import { StatusBadge } from '@/shared/components/status-badge';
import { Separator } from '@/shared/ui/separator';
import { Skeleton } from '@/shared/ui/skeleton';
import { ImagePreview } from '@/shared/components/image-preview';
import { SafeHtml } from '@/shared/components/safe-html';
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
      <span className="ms-1.5 text-sm text-muted-foreground">({rating}/5)</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square rounded-2xl" />
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
    <div className="space-y-6">
      <PageBackHeader
        title={productName}
        description={`/${detail.slug}`}
        backTo={productRoutes.list}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate(productRoutes.edit(detail.id))}>
              <Pencil className="me-2 h-4 w-4" />
              {t('common.edit')}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="me-2 h-4 w-4" />
              {t('common.delete')}
            </Button>
          </>
        }
      />

      <DetailHero
        title={productName}
        subtitle={`/${detail.slug}`}
        badges={
          <>
            <StatusBadge status={detail.status} />
            {detail.has_discount && (
              <Badge variant="outline" className="gap-1">
                <Tag className="h-3 w-3" />
                {t('products.hasDiscount')}
              </Badge>
            )}
            {detail.has_flash_sale && (
              <Badge variant="outline" className="gap-1">
                <Zap className="h-3 w-3" />
                {t('products.hasFlashSale')}
              </Badge>
            )}
          </>
        }
        avatar={
          detail.images && detail.images.length > 0 ? (
            <img
              src={detail.images[0]}
              alt={productName}
              className="h-14 w-14 shrink-0 rounded-2xl border object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <ImageIcon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
            </span>
          )
        }
        facts={[
          { icon: Tag, label: t('products.price'), value: Number(detail.current_price).toFixed(2) },
          { icon: Package, label: t('products.stock'), value: detail.available_stock },
          { icon: Package, label: t('products.sold'), value: detail.sold_quantity },
          { icon: Tag, label: t('products.sku'), value: detail.sku },
        ]}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ImageGallery images={detail.images} alt={productName} />

        <div className="space-y-5">
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
              icon={<Package className="h-4 w-4" />}
              label={t('productsForm.itemType')}
              value={detail.item_type === 'DIGITAL' ? t('productsForm.digital') : t('productsForm.physical')}
            />
            <InfoItem
              icon={detail.in_stock ? <span className="h-4 w-4 text-success">&#9679;</span> : <span className="h-4 w-4 text-destructive">&#9679;</span>}
              label={t('products.stock')}
              value={`${detail.available_stock} (${t('products.sold')}: ${detail.sold_quantity})`}
            />
            <InfoItem
              icon={<Ruler className="h-4 w-4" />}
              label={t('products.dimensions')}
              value={`${detail.height} x ${detail.width} x ${detail.length}`}
            />
            <InfoItem icon={<Weight className="h-4 w-4" />} label={t('products.weight')} value={`${detail.weight}g`} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <CardSection title={t('products.description')} icon={FileText}>
            <SafeHtml
              html={productDescription}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
              className="text-muted-foreground leading-relaxed [&_p]:mb-2 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_a]:text-primary [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:list-decimal [&_ol]:ps-5"
            />
          </CardSection>

          {detail.categories && detail.categories.length > 0 && (
            <CardSection title={t('products.categories')} icon={Tag}>
              <div className="flex flex-wrap gap-2">
                {detail.categories.map((cat) => (
                  <Badge key={cat.id} variant="outline">{cat.name}</Badge>
                ))}
              </div>
            </CardSection>
          )}

          <CardSection title={t('products.discountInfo')} icon={Tag}>

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

            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <Kv label={t('productsForm.taxEnabled')} value={detail.tax?.tax_enabled ?? detail.tax_enabled ? t('common.yes') : t('common.no')} />
              <Kv label={t('productsForm.taxRate')} value={(detail.tax?.tax_rate ?? detail.tax_rate) !== undefined && (detail.tax?.tax_rate ?? detail.tax_rate) !== null ? `${detail.tax?.tax_rate ?? detail.tax_rate}%` : '-'} />
              <Kv label={t('productsForm.taxAmount')} value={detail.tax?.amount !== undefined && detail.tax?.amount !== null ? Number(detail.tax.amount).toFixed(2) : '-'} />
              <Kv label={t('productsForm.priceIncludingTax')} value={detail.price_including_tax !== undefined && detail.price_including_tax !== null ? Number(detail.price_including_tax).toFixed(2) : '-'} />
            </div>

            <Separator className="my-4" />

            <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-warning">
              <Zap className="h-4 w-4" />
              {t('products.flashSale')}
            </h3>

            <Kv label={t('products.hasFlashSale')} value={detail.has_flash_sale ? t('common.yes') : t('common.no')} className="mb-3" />

            {detail.flash_sales && detail.flash_sales.length > 0 ? (
              <div className="space-y-3">
                {detail.flash_sales.map((fs) => {
                  const fsTitle = getLocalizedValue(fs.title, language);
                  return (
                    <div key={fs.id} className="rounded-lg border border-warning/30 bg-warning-soft p-3 space-y-1.5">
                      <p className="font-medium">{fsTitle}</p>
                      <p className="text-sm text-muted-foreground">{fs.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-warning font-medium">
                          {fs.type}: {fs.discount}
                          {fs.max_discount_amount ? ` (max ${fs.max_discount_amount})` : ''}
                        </span>
                        <StatusBadge status={fs.is_valid} />
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
          </CardSection>

          {detail.reviews && detail.reviews.length > 0 && (
            <CardSection title={t('products.reviews')} icon={Star}>
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
                      <Badge variant="outline" className="mt-2 border-transparent bg-success-soft text-success">
                        {t('products.approved')}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardSection>
          )}
        </div>

        <div className="space-y-6">
          {detail.brands && detail.brands.length > 0 && (
            <CardSection title={t('products.brand')} icon={Store}>
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
            </CardSection>
          )}

          <CardSection title={t('products.createdAt')} icon={Clock}>
            <p className="text-sm text-muted-foreground">{detail.created_at}</p>
          </CardSection>
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
                  className="rounded-lg border bg-card text-start hover:shadow-md transition-shadow overflow-hidden"
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
                      {related.has_discount && <Tag className="h-3 w-3 text-discount" />}
                      {related.has_flash_sale && <Zap className="h-3 w-3 text-discount" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {detail.banners && detail.banners.length > 0 && (
        <CardSection title={t('products.banners')} icon={ImageIcon}>
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
                <StatusBadge status={banner.status} className="ms-auto shrink-0" />
              </div>
            ))}
          </div>
        </CardSection>
      )}

      {detail.sliders && detail.sliders.length > 0 && (
        <CardSection title={t('products.sliders')} icon={Layers}>
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
                <StatusBadge status={slider.status} className="ms-auto shrink-0" />
              </div>
            ))}
          </div>
        </CardSection>
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
