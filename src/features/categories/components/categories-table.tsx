import { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Star,
  Package,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Skeleton } from '@/shared/ui/skeleton';
import { StatusBadge } from '@/shared/components/status-badge';
import { cn } from '@/shared/lib/utils';
import { CategoryImageCell } from './category-image-cell';
import { CategoryLevelBadge } from './category-level-badge';
import { CategoryDeleteDialog } from './category-delete-dialog';
import type { CategoryListItem } from '../types/category.types';

interface CategoriesTableProps {
  data: CategoryListItem[];
  isLoading: boolean;
  onEdit: (category: CategoryListItem) => void;
  onViewProducts?: (category: CategoryListItem) => void;
  onToggleFeatured?: (category: CategoryListItem) => void;
  onRefresh: () => void;
  parentMap?: Map<number, string>;
}

export function CategoriesTable({
  data,
  isLoading,
  onEdit,
  onViewProducts,
  onToggleFeatured,
  onRefresh,
  parentMap,
}: CategoriesTableProps) {
  const { t } = useTranslation();
  const [deleteTarget, setDeleteTarget] = useState<CategoryListItem | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const childrenMap = useMemo(() => {
    const map = new Map<number | null, CategoryListItem[]>();
    for (const cat of data) {
      const pid = cat.parent_id;
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)!.push(cat);
    }
    return map;
  }, [data]);

  const rootNodes = childrenMap.get(null) || [];

  const hasChildren = (id: number) => (childrenMap.get(id)?.length ?? 0) > 0;

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const flattenTree = () => {
    const result: { category: CategoryListItem; depth: number }[] = [];
    const walk = (nodes: CategoryListItem[], depth: number) => {
      for (const node of nodes) {
        result.push({ category: node, depth });
        if (expandedIds.has(node.id) && hasChildren(node.id)) {
          walk(childrenMap.get(node.id) || [], depth + 1);
        }
      }
    };
    walk(rootNodes, 0);
    return result;
  };

  const flatRows = flattenTree();

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>{t('categories.image')}</TableHead>
              <TableHead>{t('categories.name')}</TableHead>
              <TableHead>{t('categories.level')}</TableHead>
              <TableHead>{t('categories.parent')}</TableHead>
              <TableHead className="text-end">{t('categories.products')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {flatRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {t('common.noData')}
                </TableCell>
              </TableRow>
            ) : (
              flatRows.map(({ category, depth }) => (
                <TableRow key={category.id}>
                  <TableCell className="p-0">
                    <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
                      {hasChildren(category.id) ? (
                        <button
                          type="button"
                          className="p-1 text-muted-foreground hover:text-foreground"
                          onClick={() => toggleExpand(category.id)}
                        >
                          {expandedIds.has(category.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      ) : (
                        <span className="inline-block w-6" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <CategoryImageCell
                      image={category.image}
                      alt={category.name}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{category.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        /{category.slug}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <CategoryLevelBadge level={category.level} />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {category.parent_id
                        ? parentMap?.get(category.parent_id) ?? `ID: ${category.parent_id}`
                        : '\u2014'}
                    </span>
                  </TableCell>
                  <TableCell className="text-end">
                    {category.products_count}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={category.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {onToggleFeatured && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onToggleFeatured(category)}
                          title={t('categories.addToFeatured')}
                        >
                          <Star
                            className={cn(
                              'h-4 w-4',
                              category.is_featured
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            )}
                          />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(category)}>
                            <Pencil className="me-2 h-4 w-4" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          {onViewProducts && (
                            <DropdownMenuItem onClick={() => onViewProducts(category)}>
                              <Package className="me-2 h-4 w-4" />
                              {t('categories.products')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteTarget(category)}
                          >
                            <Trash2 className="me-2 h-4 w-4" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {deleteTarget && (
        <CategoryDeleteDialog
          categoryId={deleteTarget.id}
          categoryName={deleteTarget.name}
          hasChildren={hasChildren(deleteTarget.id)}
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onDeleted={onRefresh}
        />
      )}
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Parent</TableHead>
            <TableHead className="text-end">Products</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1 h-3 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-12" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell className="text-end">
                <Skeleton className="ms-auto h-4 w-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


