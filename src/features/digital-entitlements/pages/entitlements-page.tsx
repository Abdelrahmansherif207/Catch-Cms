import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { KeyRound } from 'lucide-react';
import { Pagination } from '@/shared/components/pagination';
import { PageHeader } from '@/shared/components/page-header';
import { SearchInput } from '@/shared/components/search-input';
import { DataErrorState } from '@/shared/components/data-state';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterSelect } from '@/shared/components/filter-select';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { useEntitlements } from '../hooks/use-digital-entitlements';
import { EntitlementsTable } from '../components/digital-entitlements-table';
import type { EntitlementStatus } from '../types/digital-entitlement.types';

const ENTITLEMENT_STATUSES: EntitlementStatus[] = ['pending', 'delivered', 'revoked'];

/**
 * Reads the URL query once per navigation. The wrapper remounts the inner
 * component with a key on every URL change, so deep links from the order
 * detail page (?order_id=8) seed the filters cleanly — no effects needed.
 */
export function EntitlementsPage() {
  const location = useLocation();
  return <EntitlementsPageInner key={location.search} search={location.search} />;
}

function EntitlementsPageInner({ search }: { search: string }) {
  const { t } = useTranslation();

  const url = useMemo(() => new URLSearchParams(search), [search]);
  const [page, setPage] = useState(() => Number(url.get('page')) || 1);
  const [searchText, setSearchText] = useState(() => url.get('search') ?? ''); // partial-uuid search
  const [uuid, setUuid] = useState(() => url.get('uuid') ?? ''); // exact-match filter
  const [status, setStatus] = useState<'all' | EntitlementStatus>(() => {
    const value = url.get('status');
    return ENTITLEMENT_STATUSES.includes(value as EntitlementStatus)
      ? (value as EntitlementStatus)
      : 'all';
  });
  const [orderId, setOrderId] = useState(() => url.get('order_id') ?? '');
  const [userId, setUserId] = useState(() => url.get('user_id') ?? '');

  const { data, isLoading, isError, refetch } = useEntitlements({
    page,
    per_page: 25,
    search: searchText || undefined,
    uuid: uuid || undefined,
    status: status === 'all' ? undefined : status,
    order_id: orderId ? Number(orderId) : undefined,
    user_id: userId ? Number(userId) : undefined,
  });

  const meta = data?.data?.meta;

  const hasActiveFilters = searchText || uuid || status !== 'all' || orderId || userId;

  const handleClearFilters = () => {
    setSearchText('');
    setUuid('');
    setStatus('all');
    setOrderId('');
    setUserId('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('entitlements.title')}
        description={t('entitlements.subtitle')}
      />

      <FilterBar
        activeCount={
          [searchText, uuid, orderId, userId].filter(Boolean).length + (status !== 'all' ? 1 : 0)
        }
      >
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput
            value={searchText}
            onChange={(value) => {
              setSearchText(value);
              setPage(1);
            }}
            placeholder={t('entitlements.searchPlaceholder')}
          />

          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              value={status}
              onValueChange={(value) => {
                setStatus(value as 'all' | EntitlementStatus);
                setPage(1);
              }}
              prefix={t('entitlements.status')}
              allLabel={t('entitlements.allStatuses')}
              options={ENTITLEMENT_STATUSES.map((s) => ({
                value: s,
                label: t(`entitlements.statuses.${s}`),
              }))}
              triggerClassName="w-full md:w-auto md:min-w-[160px]"
            />

            <Input
              type="text"
              placeholder={t('entitlements.uuidPlaceholder')}
              value={uuid}
              onChange={(e) => {
                setUuid(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full sm:w-52"
            />

            <Input
              type="number"
              min={0}
              placeholder={t('entitlements.orderIdPlaceholder')}
              value={orderId}
              onChange={(e) => {
                setOrderId(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full sm:w-36"
            />

            <Input
              type="number"
              min={0}
              placeholder={t('entitlements.userIdPlaceholder')}
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full sm:w-36"
            />

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                {t('common.clear')}
              </Button>
            )}
          </div>
        </div>
      </FilterBar>

      {isError && (
        <DataErrorState
          message={t('entitlements.listError')}
          onRetry={() => refetch()}
        />
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <KeyRound className="h-3.5 w-3.5" />
        {t('entitlements.listHint')}
      </div>

      <EntitlementsTable
        data={data?.data?.data ?? []}
        isLoading={isLoading}
        onRefresh={() => void refetch()}
      />

      <Pagination
        page={page}
        lastPage={meta?.last_page ?? 1}
        total={meta?.total ?? 0}
        from={meta ? (meta.current_page - 1) * meta.per_page + (meta.total > 0 ? 1 : 0) : 0}
        to={meta ? Math.min(meta.current_page * meta.per_page, meta.total) : 0}
        perPage={meta?.per_page ?? 25}
        onPageChange={setPage}
        className="py-2"
      />
    </div>
  );
}
