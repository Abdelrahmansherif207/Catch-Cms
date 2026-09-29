import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Plus, Workflow, Pencil } from 'lucide-react';
import { PageHeader } from '@/shared/components/page-header';
import { SearchInput } from '@/shared/components/search-input';
import { DataErrorState, DataEmptyState } from '@/shared/components/data-state';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterSelect } from '@/shared/components/filter-select';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { Pagination } from '@/shared/components/pagination';
import { useOrderFlows } from '../hooks/use-order-flows';
import { getLocalizedName } from '@/shared/lib/localize';
import { orderFlowRoutes } from '../routes/order-flow.routes';
import type { ShippingTypeName } from '../types/order-flow.types';

export function OrderFlowsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [shippingType, setShippingType] = useState('all');
  const [isActive, setIsActive] = useState('all');

  const { data, isLoading, isError, refetch } = useOrderFlows({
    page,
    per_page: 15,
    search: search || undefined,
    shipping_type: shippingType === 'all' ? undefined : (shippingType as ShippingTypeName),
    is_active: isActive === 'all' ? undefined : isActive === 'active',
  });

  const flows = data?.data?.data || [];
  const links = data?.data?.links;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('orderFlows.title')}
        description={t('orderFlows.subtitle')}
        actions={
          <Button onClick={() => navigate(orderFlowRoutes.create)}>
            <Plus className="me-2 h-4 w-4" />
            {t('orderFlows.create')}
          </Button>
        }
      />

      <FilterBar
        activeCount={
          [search].filter(Boolean).length +
          [shippingType, isActive].filter((v) => v !== 'all').length
        }
      >
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder={t('orderFlows.searchPlaceholder')}
          />
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              value={shippingType}
              onValueChange={(value) => {
                setShippingType(value);
                setPage(1);
              }}
              prefix={t('orderFlows.shippingType')}
              allLabel={t('orderFlows.allShippingTypes')}
              options={[
                { value: 'local', label: t('orderFlows.shippingTypes.local') },
                { value: 'international', label: t('orderFlows.shippingTypes.international') },
              ]}
              triggerClassName="w-full md:w-auto md:min-w-[190px]"
            />
            <FilterSelect
              value={isActive}
              onValueChange={(value) => {
                setIsActive(value);
                setPage(1);
              }}
              prefix={t('orderFlows.state')}
              allLabel={t('orderFlows.allStates')}
              options={[
                { value: 'active', label: t('common.active') },
                { value: 'inactive', label: t('common.inactive') },
              ]}
              triggerClassName="w-full md:w-auto md:min-w-[160px]"
            />
          </div>
        </div>
      </FilterBar>

      {isError ? (
        <DataErrorState message={t('orderFlows.listError')} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : flows.length === 0 ? (
        <DataEmptyState
          title={t('orderFlows.emptyTitle')}
          description={t('orderFlows.emptyDescription')}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {flows.map((flow) => (
            <div
              key={flow.id}
              className="cursor-pointer space-y-3 rounded-2xl border bg-card p-6 shadow-card transition-colors hover:border-primary/50"
              onClick={() => navigate(orderFlowRoutes.detail(flow.id))}
            >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info-soft text-info">
                      <Workflow className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{getLocalizedName(flow.name, lang)}</p>
                      <code className="text-xs text-muted-foreground">{flow.code}</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {flow.is_default && <Badge variant="secondary">{t('orderFlows.default')}</Badge>}
                    <Badge
                      variant="outline"
                      className={
                        flow.is_active
                          ? 'border-transparent bg-success-soft text-success'
                          : 'border-transparent bg-muted text-muted-foreground'
                      }
                    >
                      {flow.is_active ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {t(`orderFlows.shippingTypes.${flow.shipping_type}`)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {t('orderFlows.steps', { count: flow.statuses?.length ?? 0 })}
                  </span>
                </div>

                {flow.statuses && flow.statuses.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {flow.statuses.map((s) => (
                      <Badge
                        key={s.id}
                        variant="outline"
                        className="font-normal text-xs bg-muted"
                      >
                        {getLocalizedName(s.name, lang)}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(orderFlowRoutes.detail(flow.id));
                    }}
                  >
                    <Pencil className="me-2 h-4 w-4" />
                    {t('common.edit')}
                  </Button>
                </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        lastPage={links?.last_page ?? 1}
        total={links?.total ?? 0}
        from={links?.from ?? 0}
        to={links?.to ?? 0}
        perPage={links?.per_page ?? 15}
        onPageChange={setPage}
        className="py-2"
      />
    </div>
  );
}
