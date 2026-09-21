import { useState, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { FilterBar } from '@/shared/ui/filter-bar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Pagination } from '@/shared/components/pagination';
import { PageHeader } from '@/shared/components/page-header';
import { SearchInput } from '@/shared/components/search-input';
import { DataErrorState } from '@/shared/components/data-state';
import { AttributesTable } from '../components/attributes-table';
import { AttributeFormDialog } from '../components/attribute-form-dialog';
import { useAttributes } from '../hooks/use-attributes';
import type { Attribute } from '../types/attribute.types';

export function AttributesPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState('id');
  const [sortedBy, setSortedBy] = useState('asc');
  const [openForm, setOpenForm] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);

  const params = {
    page,
    perPage,
    search: search || undefined,
    order: order || undefined,
    sortedBy: sortedBy || undefined,
  };

  const { data, isLoading, isError, refetch } = useAttributes(params);

  const attributes = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;
  const lastPage = data?.data?.last_page ?? 1;
  const from = data?.data?.from ?? 0;
  const to = data?.data?.to ?? 0;

  const handleEdit = useCallback((attr: Attribute) => {
    setEditingAttribute(attr);
    setOpenForm(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingAttribute(null);
    setOpenForm(true);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setOpenForm(false);
    setEditingAttribute(null);
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('attributes.pageTitle')}
        description={t('attributes.subtitle')}
        actions={
          <>
            <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="me-1.5 h-4 w-4" />
              {t('common.create')}
            </Button>
          </>
        }
      />

      <FilterBar activeCount={[search].filter(Boolean).length}>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder={t('attributes.searchPlaceholder')}
          />
          <Select value={order} onValueChange={(v) => { if (v) setOrder(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-full md:w-[150px]">
              <SelectValue placeholder={t('attributes.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">{t('attributes.sortId')}</SelectItem>
              <SelectItem value="name">{t('attributes.sortName')}</SelectItem>
              <SelectItem value="slug">{t('attributes.sortSlug')}</SelectItem>
              <SelectItem value="created_at">{t('attributes.sortCreatedAt')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortedBy} onValueChange={(v) => { if (v) setSortedBy(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-full md:w-[120px]">
              <SelectValue placeholder={t('attributes.sortedBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">{t('attributes.asc')}</SelectItem>
              <SelectItem value="desc">{t('attributes.desc')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(perPage)} onValueChange={(v) => { if (v) setPerPage(Number(v)); setPage(1); }}>
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
      </FilterBar>

      {isError && (
        <DataErrorState onRetry={() => refetch()} />
      )}

      <AttributesTable
        data={attributes}
        isLoading={isLoading}
        onEdit={handleEdit}
        onRefresh={() => refetch()}
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

      <AttributeFormDialog
        attribute={editingAttribute}
        open={openForm}
        onOpenChange={setOpenForm}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
