import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { PageBackHeader } from '@/shared/components/page-header';
import { ProductForm } from '../components/product-form';
import { productRoutes } from '../routes/product.routes';

export function CreateProductPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageBackHeader
        title={t('productsForm.createProduct')}
        description={t('productsForm.createSubtitle')}
        backTo={productRoutes.list}
      />

      <div className="rounded-2xl border bg-card p-4 shadow-card sm:p-6">
        <ProductForm
          onSuccess={() => navigate('/products')}
          onCancel={() => navigate('/products')}
        />
      </div>
    </div>
  );
}
