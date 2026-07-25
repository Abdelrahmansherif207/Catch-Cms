import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Pencil, Trash2, Loader2, List } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { useAttribute, useDeleteAttribute } from '../hooks/use-attributes';
import { attributeRoutes } from '../routes/attribute.routes';
import { AttributeDeleteDialog } from '../components/attribute-delete-dialog';
import { useState } from 'react';

function parseJsonField(value: string): { en: string; ar: string } {
  try {
    const parsed = JSON.parse(value);
    return { en: parsed.en || '', ar: parsed.ar || '' };
  } catch {
    return { en: value, ar: value };
  }
}

export function AttributeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const attributeId = Number(id);
  const { data: response, isLoading, isError } = useAttribute(attributeId);
  const deleteMutation = useDeleteAttribute();

  const attr = response?.data;
  const lang = i18n.language || 'en';

  const handleDelete = () => {
    deleteMutation.mutate(attributeId, {
      onSuccess: () => {
        navigate(attributeRoutes.list);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !attr) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <List className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">{t('attributes.notFound')}</p>
        <Button variant="outline" onClick={() => navigate(attributeRoutes.list)}>
          <ArrowLeft className="me-2 h-4 w-4" />
          {t('attributes.backToList')}
        </Button>
      </div>
    );
  }

  const parsedName: { en: string; ar: string } = typeof attr.name === 'string'
    ? parseJsonField(attr.name)
    : { en: String(attr.name), ar: String(attr.name) };

  const currentName = lang === 'ar' && parsedName.ar ? parsedName.ar : parsedName.en;
  const values = attr.values ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(attributeRoutes.list)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{currentName}</h1>
            <p className="text-sm text-muted-foreground">{t('attributes.detailSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(attributeRoutes.list)}>
            <Pencil className="me-2 h-4 w-4" />
            {t('common.edit')}
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="me-2 h-4 w-4" />
            {t('common.delete')}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('attributes.attributeInfo')}
        </h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('attributes.id')}</dt>
            <dd className="font-medium">{attr.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('attributes.name')} (EN)</dt>
            <dd className="font-medium" dir="ltr">{parsedName.en}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('attributes.name')} (AR)</dt>
            <dd className="font-medium" dir="rtl">{parsedName.ar}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('attributes.slug')}</dt>
            <dd className="font-medium">
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{attr.slug}</code>
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('attributes.valuesCount', { count: values.length })}
        </h2>
        {values.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('attributes.noValues')}</p>
        ) : (
          <div className="space-y-2">
            {values.map((v) => {
              const parsedValue: { en: string; ar: string } = typeof v.value === 'string'
                ? parseJsonField(v.value)
                : { en: String(v.value), ar: String(v.value) };
              const displayValue = lang === 'ar' && parsedValue.ar ? parsedValue.ar : parsedValue.en;
              return (
                <div key={v.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {displayValue}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {parsedValue.en}{parsedValue.ar ? ` / ${parsedValue.ar}` : ''}
                    </span>
                  </div>
                  {v.slug && (
                    <code className="text-xs text-muted-foreground font-mono">{v.slug}</code>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AttributeDeleteDialog
        attributeId={attributeId}
        attributeName={currentName}
        valuesCount={values.length}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={handleDelete}
      />
    </div>
  );
}
