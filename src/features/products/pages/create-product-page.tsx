import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { ProductForm } from '../components/product-form';

export function CreateProductPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/products')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t('productsForm.createProduct')}
          </h1>
          <p className="text-muted-foreground">
            {t('productsForm.createSubtitle')}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <ProductForm
          onSuccess={() => navigate('/products')}
          onCancel={() => navigate('/products')}
        />
      </div>
    </div>
  );
}
