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
import { useTags } from '../hooks/use-tags';
import { TagsTable } from '../components/tags-table';
import { TagFormDialog } from '../components/tag-form-dialog';
import type { Tag } from '../types/tag.types';

export function TagsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [order, setOrder] = useState('id');
  const [sortedBy, setSortedBy] = useState('asc');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const params = {
    page,
    perPage,
    search: search || undefined,
    order: order || undefined,
    sortedBy: sortedBy || undefined,
  };

  const { data, isLoading, refetch } = useTags(params);

  const tags = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;
  const from = data?.data?.from ?? 0;
  const to = data?.data?.to ?? 0;
  const lastPage = data?.data?.last_page ?? 1;

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingTag(null);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingTag(null);
    refetch();
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('tags.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('tags.subtitle')}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('tags.addTag')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('tags.searchPlaceholder')}
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

        <Select value={order} onValueChange={(v) => v && (setOrder(v), setPage(1))}>
          <SelectTrigger className="h-8 w-full md:w-[130px]">
            <SelectValue placeholder={t('tags.sortBy')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">{t('tags.sortName')}</SelectItem>
            <SelectItem value="slug">Slug</SelectItem>
            <SelectItem value="created_at">{t('tags.sortCreatedAt')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortedBy} onValueChange={(v) => v && (setSortedBy(v), setPage(1))}>
          <SelectTrigger className="h-8 w-full md:w-[120px]">
            <SelectValue placeholder={t('tags.sortedBy')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">{t('tags.asc')}</SelectItem>
            <SelectItem value="desc">{t('tags.desc')}</SelectItem>
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

      <TagsTable
        data={tags}
        isLoading={isLoading}
        onEdit={handleEdit}
        onRefresh={refetch}
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

      <TagFormDialog
        tag={editingTag}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
