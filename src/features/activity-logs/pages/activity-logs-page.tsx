import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/shared/components/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useActivityLogs } from '../hooks/use-activity-logs';
import { ActivityLogFilters } from '../components/activity-log-filters';
import { ActivityLogsTable } from '../components/activity-logs-table';

export function ActivityLogsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [logName, setLogName] = useState('');
  const [event, setEvent] = useState('');

  const params = {
    page,
    perPage,
    search: search || undefined,
    logName: logName || undefined,
    event: event || undefined,
  };

  const { data, isLoading } = useActivityLogs(params);

  const logs = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const from = data?.meta?.from ?? 0;
  const to = data?.meta?.to ?? 0;
  const lastPage = data?.meta?.last_page ?? 1;

  const handleClear = () => {
    setSearch('');
    setLogName('');
    setEvent('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{t('activityLogs.pageTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('activityLogs.pageDescription')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ActivityLogFilters
          search={search}
          logName={logName}
          event={event}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          onLogNameChange={(v) => { if (!v) return; setLogName(v === '__all__' ? '' : v); setPage(1); }}
          onEventChange={(v) => { if (!v) return; setEvent(v === '__all__' ? '' : v); setPage(1); }}
          onClear={handleClear}
        />

        <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
          <SelectTrigger className="h-8 w-full md:w-[90px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="15">15</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ActivityLogsTable data={logs} isLoading={isLoading} />

      <Pagination
        page={page}
        lastPage={lastPage}
        total={total}
        from={from}
        to={to}
        perPage={perPage}
        onPageChange={setPage}
      />
    </div>
  );
}
