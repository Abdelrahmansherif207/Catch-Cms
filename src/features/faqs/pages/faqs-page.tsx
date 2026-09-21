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
import { FaqsTable } from '../components/faqs-table';
import { FaqFormDialog } from '../components/faq-form-dialog';
import { useFaqs } from '../hooks/use-faqs';
import type { Faq } from '../types/faq.types';

export function FaqsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState('created_at');
  const [sortedBy, setSortedBy] = useState('desc');
  const [openForm, setOpenForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);

  const params = {
    page,
    perPage,
    search: search || undefined,
    order: order || undefined,
    sortedBy: sortedBy || undefined,
  };

  const { data, isLoading, isError, refetch } = useFaqs(params);

  const faqs = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;
  const lastPage = data?.data?.last_page ?? 1;
  const from = data?.data?.from ?? 0;
  const to = data?.data?.to ?? 0;

  const handleEdit = useCallback((faq: Faq) => {
    setEditingFaq(faq);
    setOpenForm(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingFaq(null);
    setOpenForm(true);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setOpenForm(false);
    setEditingFaq(null);
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('faqs.pageTitle')}
        description={t('faqs.subtitle')}
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
            placeholder={t('faqs.searchPlaceholder')}
          />
          <Select value={order} onValueChange={(v) => { if (v) setOrder(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-full md:w-[150px]">
              <SelectValue placeholder={t('faqs.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">{t('faqs.sortCreatedAt')}</SelectItem>
              <SelectItem value="faq_title">{t('faqs.sortTitle')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortedBy} onValueChange={(v) => { if (v) setSortedBy(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-full md:w-[120px]">
              <SelectValue placeholder={t('faqs.sortedBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">{t('faqs.asc')}</SelectItem>
              <SelectItem value="desc">{t('faqs.desc')}</SelectItem>
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
      </FilterBar>

      {isError && (
        <DataErrorState onRetry={() => refetch()} />
      )}

      <FaqsTable
        data={faqs}
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

      <FaqFormDialog
        faq={editingFaq}
        open={openForm}
        onOpenChange={setOpenForm}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
