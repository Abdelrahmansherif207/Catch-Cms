import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Pagination } from '@/shared/components/pagination';
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

  const { data, isLoading, refetch } = useUsers(params);

  const users = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;
  const from = data?.data?.from ?? 0;
  const to = data?.data?.to ?? 0;
  const lastPage = data?.data?.last_page ?? 1;

  const handleFormSuccess = () => {
    setFormOpen(false);
    refetch();
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('users.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('users.subtitle')}</p>
        </div>
        {!showTrash && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('users.addUser')}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('users.searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="ps-9"
            />
          </div>

          {search && (
            <Button variant="ghost" size="sm" onClick={handleClearSearch}>
              {t('common.clear')}
            </Button>
          )}

          <Select value={typeFilter} onValueChange={(v) => v && (setTypeFilter(v), setPage(1))}>
            <SelectTrigger className="h-8 w-full md:w-[140px]">
              <SelectValue placeholder={t('users.type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('users.allTypes')}</SelectItem>
              <SelectItem value="users">{t('users.usersOnly')}</SelectItem>
              <SelectItem value="admins">{t('users.adminsOnly')}</SelectItem>
            </SelectContent>
          </Select>

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

      <Tabs value={statusTab} onValueChange={handleStatusChange}>
        <TabsList>
          <TabsTrigger value="all">{t('users.allStatuses')}</TabsTrigger>
          <TabsTrigger value="active">{t('users.active')}</TabsTrigger>
          <TabsTrigger value="inactive">{t('users.inactive')}</TabsTrigger>
          <TabsTrigger value="trash">{t('users.showTrash')}</TabsTrigger>
        </TabsList>
      </Tabs>

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
