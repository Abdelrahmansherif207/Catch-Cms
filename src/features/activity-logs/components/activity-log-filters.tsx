import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { SearchInput } from '@/shared/components/search-input';
import { FilterSelect } from '@/shared/components/filter-select';

const LOG_NAME_OPTIONS = [
  { value: 'products', labelKey: 'sidebar.products' },
  { value: 'categories', labelKey: 'sidebar.categories' },
  { value: 'brands', labelKey: 'sidebar.brands' },
  { value: 'coupons', labelKey: 'sidebar.coupons' },
  { value: 'flash_sales', labelKey: 'sidebar.flashSale' },
  { value: 'promotions', labelKey: 'sidebar.promotions' },
  { value: 'roles', labelKey: 'sidebar.roles' },
  { value: 'users', labelKey: 'sidebar.users' },
  { value: 'orders', labelKey: 'sidebar.orders' },
  { value: 'settings', labelKey: 'sidebar.settings' },
];

const EVENT_OPTIONS = [
  'created',
  'updated',
  'deleted',
  'restored',
  'forceDeleted',
  'statusChanged',
  'roleUpdated',
  'banned',
  'activated',
];

interface ActivityLogFiltersProps {
  search: string;
  logName: string;
  event: string;
  onSearchChange: (value: string) => void;
  onLogNameChange: (value: string | null) => void;
  onEventChange: (value: string | null) => void;
  onClear: () => void;
}

export function ActivityLogFilters({
  search,
  logName,
  event,
  onSearchChange,
  onLogNameChange,
  onEventChange,
  onClear,
}: ActivityLogFiltersProps) {
  const { t } = useTranslation();
  const hasFilters = search || logName || event;

  return (
    <>
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder={t('activityLogs.searchPlaceholder')}
      />

      <FilterSelect
        value={logName}
        onValueChange={onLogNameChange}
        prefix={t('activityLogs.entity')}
        allLabel={t('activityLogs.allLogNames')}
        options={LOG_NAME_OPTIONS.map((opt) => ({
          value: opt.value,
          label: t(opt.labelKey),
        }))}
        allValue=""
        triggerClassName="w-full md:w-auto md:min-w-[190px]"
      />

      <FilterSelect
        value={event}
        onValueChange={onEventChange}
        prefix={t('activityLogs.event')}
        allLabel={t('activityLogs.allEvents')}
        options={EVENT_OPTIONS.map((opt) => ({
          value: opt,
          label: opt.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim(),
        }))}
        allValue=""
        triggerClassName="w-full md:w-auto md:min-w-[190px]"
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          {t('common.clear')}
        </Button>
      )}
    </>
  );
}
