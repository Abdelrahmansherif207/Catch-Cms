import { useState } from 'react';
import { Star, StarOff, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Pagination } from '@/shared/components/pagination';
import { Input } from '@/shared/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Skeleton } from '@/shared/ui/skeleton';
import { CategoryImageCell } from '../components/category-image-cell';
import { CategoryLevelBadge } from '../components/category-level-badge';
import { useFeaturedCategories, useToggleFeatured, useCategories } from '../hooks/use-categories';

export function FeaturedCategoriesPage() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useFeaturedCategories(page, 15);
  const getName = (cat: Record<string, unknown>) => {
    const n = cat.name;
    if (typeof n === 'string') return n;
    if (n && typeof n === 'object') return (n as Record<string, string>)[i18n.language] ?? (n as Record<string, string>).en ?? '';
    return '';
  };
  const toggleMutation = useToggleFeatured();

  const handleRemove = (id: number) => {
    toggleMutation.mutate(id, {
      onSuccess: () => refetch(),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t('categories.featuredCategories')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('categories.featuredSubtitle')}
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('categories.image')}</TableHead>
              <TableHead>{t('categories.name')}</TableHead>
              <TableHead>{t('categories.level')}</TableHead>
              <TableHead className="text-end">{t('categories.products')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-10 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell className="text-end"><Skeleton className="ms-auto h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : (data?.data?.data?.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <StarOff className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">{t('categories.noFeatured')}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.data?.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <CategoryImageCell image={category.image} alt={getName(category as any)} />
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{getName(category as any)}</p>
                      <p className="text-xs text-muted-foreground truncate">/{category.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <CategoryLevelBadge level={category.level} />
                  </TableCell>
                  <TableCell className="text-end">
                    {category.products_count}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemove(category.id)}
                      disabled={toggleMutation.isPending}
                    >
                      <StarOff className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page}
        lastPage={data?.data?.last_page ?? 1}
        total={data?.data?.total ?? 0}
        from={data?.data?.from ?? 0}
        to={data?.data?.to ?? 0}
        perPage={15}
        onPageChange={setPage}
        className="py-2" />
    </div>
  );
}

export function AddFeaturedCategoryDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { t, i18n } = useTranslation();
  const getName = (cat: Record<string, unknown>) => {
    const n = cat.name;
    if (typeof n === 'string') return n;
    if (n && typeof n === 'object') return (n as Record<string, string>)[i18n.language] ?? (n as Record<string, string>).en ?? '';
    return '';
  };
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data, isLoading } = useCategories({ perPage: 50, search: search || undefined });
  const toggleMutation = useToggleFeatured();

  const handleAdd = () => {
    if (!selectedId) return;
    toggleMutation.mutate(selectedId, {
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        setSelectedId(null);
        setSearch('');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('categories.addFeatured')}</DialogTitle>
          <DialogDescription>
            {t('categories.selectCategory')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('categories.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (data?.data?.data?.length ?? 0) === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                {t('common.noData')}
              </p>
            ) : (
              data?.data?.data?.map((category) => (
                <div
                  key={category.id}
                  className={`flex items-center gap-3 rounded-md p-2 cursor-pointer transition-colors ${
                    selectedId === category.id
                      ? 'bg-primary/10 border border-primary'
                      : 'hover:bg-muted border border-transparent'
                  }`}
                  onClick={() => setSelectedId(category.id)}
                >
                  <CategoryImageCell image={category.image} alt={getName(category as any)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{category.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {category.products_count} {t('categories.products').toLowerCase()}
                    </p>
                  </div>
                  {selectedId === category.id && (
                    <Star className="h-4 w-4 text-primary fill-primary" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedId || toggleMutation.isPending}
          >
            {toggleMutation.isPending ? t('common.loading') : t('categories.addToFeatured')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



