import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { useProduct } from '../hooks/use-products';
import { ProductForm } from '../components/product-form';
import { productRoutes } from '../routes/product.routes';
import type { ProductFormValues } from '../schemas/product.schema';
import type { Product } from '../types/product.types';

function parseJsonField(val: string): { en: string; ar: string } {
  try {
    const parsed = JSON.parse(val);
    if (typeof parsed === 'object' && parsed !== null) {
      return { en: parsed.en || '', ar: parsed.ar || '' };
    }
  } catch {
    return { en: val, ar: val };
  }
  return { en: val, ar: val };
}

function productToFormValues(product: Product): ProductFormValues {
  const name = parseJsonField(product.name);
  const description = parseJsonField(product.description);

  return {
    productType: (product.product_type as 'simple' | 'variable') || 'simple',
    nameEn: name.en,
    nameAr: name.ar,
    descriptionEn: description.en,
    descriptionAr: description.ar,
    price: product.price || undefined,
    quantity: product.stock_quantity || undefined,
    inStock: product.in_stock === 1,
    status: product.status,
    categoryIds: product.categories?.map((c) => c.id) || [],
    brandIds: product.brands?.map((b) => b.id) || [],
    bannerIds: product.banners?.map((b) => b.id) || [],
    sliderIds: product.sliders?.map((s) => s.id) || [],
    hasDiscount: product.has_discount,
    discountStatus: product.discount_valid ?? true,
    discountType: product.discount_type || undefined,
    discountAmount: product.discount_amount || undefined,
    startDate: product.start_date || undefined,
    endDate: product.end_date || undefined,
    hasFlashSale: product.has_flash_sale,
    flashSaleId: product.flash_sales?.[0]?.id || undefined,
    height: product.height ? Number(product.height) : undefined,
    width: product.width ? Number(product.width) : undefined,
    length: product.length ? Number(product.length) : undefined,
    weight: product.weight ? Number(product.weight) : undefined,
    images: [],
    variants:
      product.variants?.map((v) => ({
        price: v.price,
        quantity: v.quantity,
        sku: v.sku || '',
        attributeValueIds: v.attribute_values,
        height: v.height ? Number(v.height) : undefined,
        width: v.width ? Number(v.width) : undefined,
        length: v.length ? Number(v.length) : undefined,
        weight: v.weight ? Number(v.weight) : undefined,
      })) || [],
  };
}

function EditPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="rounded-lg border bg-card p-6 space-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data, isLoading } = useProduct(Number(id));
  const detail = data?.data;

  if (isLoading) {
    return <EditPageSkeleton />;
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

  const formValues = productToFormValues(detail);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(productRoutes.detail(detail.id))}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t('productsForm.editProduct')}
          </h1>
          <p className="text-muted-foreground">
            {t('productsForm.editSubtitle')}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <ProductForm
          productId={detail.id}
          initialValues={formValues}
          onSuccess={() => navigate(productRoutes.detail(detail.id))}
          onCancel={() => navigate(productRoutes.detail(detail.id))}
        />
      </div>
    </div>
  );
}
