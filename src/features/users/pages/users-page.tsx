import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Pagination } from '@/shared/components/pagination';
import { PageHeader } from '@/shared/components/page-header';
import { SearchInput } from '@/shared/components/search-input';
import { DataErrorState } from '@/shared/components/data-state';
import { FilterBar } from '@/shared/ui/filter-bar';
import { FilterSelect } from '@/shared/components/filter-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/shared/ui/tabs';
import { useUsers } from '../hooks/use-users';
import { UsersTable } from '../components/users-table';
import { UserFormDialog } from '../components/user-form-dialog';


export function UsersPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusTab, setStatusTab] = useState<string>('all');
  const [orderBy, setOrderBy] = useState('created_at');
  const [sort, setSort] = useState('desc');
  const [formOpen, setFormOpen] = useState(false);

  const showTrash = statusTab === 'trash';

  const params = {
    page,
    perPage,
    search: search || undefined,
    users: typeFilter === 'users' ? true : undefined,
    admins: typeFilter === 'admins' ? true : undefined,
    active: statusTab === 'active' ? true : undefined,
    inActive: statusTab === 'inactive' ? true : undefined,
    orderBy: orderBy || undefined,
    sort: sort || undefined,
    trash: showTrash || undefined,
  };

  const { data, isLoading, isError, refetch } = useUsers(params);

  const users = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;
  const from = data?.data?.from ?? 0;
  const to = data?.data?.to ?? 0;
  const lastPage = data?.data?.last_page ?? 1;

  const handleFormSuccess = () => {
    setFormOpen(false);
    refetch();
  };

  const handleStatusChange = (value: string) => {
    setStatusTab(value);
    setPage(1);
  };

  const handleSortChange = (field: string) => {
    if (orderBy === field) {
      setSort(sort === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(field);
      setSort('asc');
    }
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('users.title')}
        description={t('users.subtitle')}
        actions={
          !showTrash && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="me-2 h-4 w-4" />
              {t('users.addUser')}
            </Button>
          )
        }
      />

      <FilterBar
        activeCount={
          [search].filter(Boolean).length +
          [typeFilter, statusTab].filter((v) => v !== 'all').length
        }
      >
        <div className="flex w-full flex-wrap items-end gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder={t('users.searchPlaceholder')}
          />

          <FilterSelect
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              setPage(1);
            }}
            prefix={t('users.type')}
            allLabel={t('users.allTypes')}
            options={[
              { value: 'users', label: t('users.usersOnly') },
              { value: 'admins', label: t('users.adminsOnly') },
            ]}
            triggerClassName="w-full md:w-auto md:min-w-[190px]"
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
      </div>
      </FilterBar>

      <Tabs value={statusTab} onValueChange={handleStatusChange}>
        <TabsList>
          <TabsTrigger value="all">{t('users.allStatuses')}</TabsTrigger>
          <TabsTrigger value="active">{t('users.active')}</TabsTrigger>
          <TabsTrigger value="inactive">{t('users.inactive')}</TabsTrigger>
          <TabsTrigger value="trash">{t('users.showTrash')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {isError && (
        <DataErrorState
          message={t('users.listError')}
          onRetry={() => refetch()}
        />
      )}

      <UsersTable
        data={users}
        isLoading={isLoading}
        isTrash={showTrash}
        onRefresh={refetch}
        orderBy={orderBy}
        sort={sort}
        onSortChange={handleSortChange}
      />

      <Pagination
        page={page}
        lastPage={lastPage}
        total={total}
        from={from}
        to={to}
        perPage={perPage}
        onPageChange={setPage}
      />

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
