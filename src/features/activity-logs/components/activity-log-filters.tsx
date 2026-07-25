import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

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
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('activityLogs.searchPlaceholder')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="ps-9"
        />
      </div>

      <Select value={logName || '__all__'} onValueChange={onLogNameChange}>
        <SelectTrigger className="h-8 w-full md:w-[160px]">
          <SelectValue placeholder={t('activityLogs.allLogNames')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('activityLogs.allLogNames')}</SelectItem>
          {LOG_NAME_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={event || '__all__'} onValueChange={onEventChange}>
        <SelectTrigger className="h-8 w-full md:w-[150px]">
          <SelectValue placeholder={t('activityLogs.allEvents')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('activityLogs.allEvents')}</SelectItem>
          {EVENT_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          {t('common.clear')}
        </Button>
      )}
    </>
  );
}
