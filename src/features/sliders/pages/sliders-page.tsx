import { useState, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Pagination } from '@/shared/components/pagination';
import { SlidersTable } from '../components/sliders-table';
import { SliderFormDialog } from '../components/slider-form-dialog';
import { useSliders } from '../hooks/use-sliders';
import type { Slider } from '../types/slider.types';

export function SlidersPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [order, setOrder] = useState('order');
  const [sortedBy, setSortedBy] = useState('asc');
  const [openForm, setOpenForm] = useState(false);
  const [editingSlider, setEditingSlider] = useState<Slider | null>(null);

  const params = {
    page,
    perPage,
    active: activeFilter === '1' ? true : activeFilter === '0' ? false : undefined,
    order: order || undefined,
    sortedBy: sortedBy || undefined,
  };

  const { data, isLoading, refetch } = useSliders(params);

  const sliders = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;
  const lastPage = data?.data?.last_page ?? 1;
  const from = data?.data?.from ?? 0;
  const to = data?.data?.to ?? 0;

  const handleEdit = useCallback((slider: Slider) => {
    setEditingSlider(slider);
    setOpenForm(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingSlider(null);
    setOpenForm(true);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setOpenForm(false);
    setEditingSlider(null);
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{t('sliders.pageTitle')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="me-1.5 h-4 w-4" />
            {t('common.create')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={activeFilter} onValueChange={(v) => v && (setActiveFilter(v), setPage(1))}>
          <SelectTrigger className="h-8 w-full md:w-[130px]">
            <SelectValue placeholder={t('common.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('sliders.allStatuses')}</SelectItem>
            <SelectItem value="1">{t('sliders.active')}</SelectItem>
            <SelectItem value="0">{t('sliders.inactive')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={order} onValueChange={(v) => v && (setOrder(v), setPage(1))}>
          <SelectTrigger className="h-8 w-full md:w-[150px]">
            <SelectValue placeholder={t('sliders.sortBy')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="order">{t('sliders.sortOrder')}</SelectItem>
            <SelectItem value="title">{t('sliders.sortTitle')}</SelectItem>
            <SelectItem value="created_at">{t('sliders.sortCreatedAt')}</SelectItem>
            <SelectItem value="status">{t('sliders.sortStatus')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortedBy} onValueChange={(v) => v && (setSortedBy(v), setPage(1))}>
          <SelectTrigger className="h-8 w-full md:w-[120px]">
            <SelectValue placeholder={t('sliders.sortedBy')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">{t('sliders.asc')}</SelectItem>
            <SelectItem value="desc">{t('sliders.desc')}</SelectItem>
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

      <SlidersTable
        data={sliders}
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

      <SliderFormDialog
        slider={editingSlider}
        open={openForm}
        onOpenChange={setOpenForm}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
