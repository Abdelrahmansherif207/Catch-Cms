import { useState, useCallback } from 'react';
import { MoreHorizontal, Eye, ExternalLink, Pencil, Trash2, Copy, Check, Tag, Zap, ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ImagePreview } from '@/shared/components/image-preview';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Skeleton } from '@/shared/ui/skeleton';
import { StatusBadge } from '@/shared/components/status-badge';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { ProductDeleteDialog } from './product-delete-dialog';
import type { Product } from '../types/product.types';

interface ProductsTableProps {
  data: Product[];
  isLoading: boolean;
  onView: (product: Product) => void;
  onNavigateDetail: (product: Product) => void;
  onEdit: (product: Product) => void;
  onRefresh: () => void;
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
}

export function ProductsTable({ data, isLoading, onView, onNavigateDetail, onEdit, onRefresh, selectedIds, onSelectionChange }: ProductsTableProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [copiedSlugId, setCopiedSlugId] = useState<number | null>(null);

  const allSelected = data.length > 0 && data.every((p) => selectedIds.includes(p.id));
  const someSelected = data.some((p) => selectedIds.includes(p.id));

  const toggleSelect = useCallback((id: number) => {
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id]
    );
  }, [selectedIds, onSelectionChange]);

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      onSelectionChange(selectedIds.filter((id) => !data.some((p) => p.id === id)));
    } else {
      const newIds = [...selectedIds];
      data.forEach((p) => {
        if (!newIds.includes(p.id)) newIds.push(p.id);
      });
      onSelectionChange(newIds);
    }
  }, [allSelected, selectedIds, data, onSelectionChange]);

  const handleCopySlug = async (slug: string, id: number) => {
    try {
      await navigator.clipboard.writeText(slug);
      setCopiedSlugId(id);
      toast.success(t('products.slugCopied'));
      setTimeout(() => setCopiedSlugId(null), 2000);
    } catch {
      toast.error(t('products.slugCopyFailed'));
    }
  };

  if (isLoading) {
    return isMobile ? <MobileCardSkeleton /> : <DesktopSkeleton />;
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border">
        <div className="flex h-24 items-center justify-center">
          <p className="text-muted-foreground">{t('common.noData')}</p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          {data.map((product) => (
              <ProductCard
                  key={product.id}
                  product={product}
                  copiedSlugId={copiedSlugId}
                  onCopySlug={handleCopySlug}
                  onView={onView}
                  onNavigateDetail={onNavigateDetail}
                  onEdit={onEdit}
                  onDelete={setDeleteTarget}
                  selected={selectedIds.includes(product.id)}
                  onToggleSelect={toggleSelect}
                />
          ))}
        </div>
        {deleteTarget && (
          <ProductDeleteDialog
            productId={deleteTarget.id}
            productName={deleteTarget.name}
            open={!!deleteTarget}
            onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
            onDeleted={onRefresh}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  onChange={toggleSelectAll}
                  className="size-4 cursor-pointer"
                />
              </TableHead>
              <TableHead className="w-12">{t('products.image')}</TableHead>
              <TableHead>{t('products.name')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('products.slug')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('products.sku')}</TableHead>
              <TableHead>{t('products.price')}</TableHead>
              <TableHead>{t('products.stock')}</TableHead>
              <TableHead>{t('products.status')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('products.categories')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('products.date')}</TableHead>
              <TableHead className="hidden md:table-cell w-20">{t('products.discount')}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((product) => (
              <TableRow key={product.id} aria-selected={selectedIds.includes(product.id)} data-selected={selectedIds.includes(product.id) || undefined}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    className="size-4 cursor-pointer"
                  />
                </TableCell>
                <TableCell>
                  {product.images && product.images.length > 0 ? (
                    <ImagePreview
                      src={product.images[0]}
                      alt={product.name}
                      thumbnailClassName="h-10 w-10 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-border bg-muted shrink-0">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <p className="font-medium truncate max-w-[200px]">{product.name}</p>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <button
                    type="button"
                    onClick={() => handleCopySlug(product.slug, product.id)}
                    className="group flex items-center gap-1.5 text-sm text-muted-foreground font-mono hover:text-foreground transition-colors"
                  >
                    <span className="truncate max-w-[140px]">{product.slug}</span>
                    {copiedSlugId === product.id ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm text-muted-foreground font-mono truncate max-w-[120px] block">{product.sku}</span>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="font-medium whitespace-nowrap">{Number(product.current_price).toFixed(2)}</p>
                    {product.price_after_discount && (
                      <p className="text-xs text-muted-foreground line-through whitespace-nowrap">
                        {Number(product.price).toFixed(2)}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={product.in_stock ? 'text-green-600' : 'text-red-600'}>
                    {product.available_stock}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={product.status} className="whitespace-nowrap" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-wrap gap-1 max-w-[240px]">
                    {product.categories?.map((cat) => (
                      <Badge key={cat.id} variant="outline" className="text-xs">
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell whitespace-nowrap text-sm text-muted-foreground">
                  {format(new Date(product.created_at), 'PP')}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex gap-1">
                    {product.has_discount && (
                      <span title={t('products.hasDiscount')}>
                        <Tag className="h-4 w-4 text-amber-500" />
                      </span>
                    )}
                    {product.has_flash_sale && (
                      <span title={t('products.hasFlashSale')}>
                        <Zap className="h-4 w-4 text-orange-500" />
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(product)}>
                        <Eye className="me-2 h-4 w-4" />
                        {t('common.view')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onNavigateDetail(product)}>
                        <ExternalLink className="me-2 h-4 w-4" />
                        {t('products.viewDetails')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(product)}>
                        <Pencil className="me-2 h-4 w-4" />
                        {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteTarget(product)}
                      >
                        <Trash2 className="me-2 h-4 w-4" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {deleteTarget && (
        <ProductDeleteDialog
          productId={deleteTarget.id}
          productName={deleteTarget.name}
          open={!!deleteTarget}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
          onDeleted={onRefresh}
        />
      )}
    </>
  );
}

/* ─── Mobile Card ─── */

interface ProductCardProps {
  product: Product;
  copiedSlugId: number | null;
  onCopySlug: (slug: string, id: number) => void;
  onView: (product: Product) => void;
  onNavigateDetail: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  selected: boolean;
  onToggleSelect: (id: number) => void;
}

function ProductCard({ product, copiedSlugId, onCopySlug, onView, onNavigateDetail, onEdit, onDelete, selected, onToggleSelect }: ProductCardProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={`rounded-lg border bg-card p-3 space-y-2 ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(product.id)}
          className="mt-1 size-4 cursor-pointer shrink-0"
        />
        {product.images && product.images.length > 0 ? (
          <ImagePreview
            src={product.images[0]}
            alt={product.name}
            thumbnailClassName="h-14 w-14 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-border bg-muted shrink-0">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium truncate">{product.name}</p>
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { onView(product); setMenuOpen(false); }}>
                  <Eye className="me-2 h-4 w-4" />
                  {t('common.view')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { onNavigateDetail(product); setMenuOpen(false); }}>
                  <ExternalLink className="me-2 h-4 w-4" />
                  {t('products.viewDetails')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { onEdit(product); setMenuOpen(false); }}>
                  <Pencil className="me-2 h-4 w-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => { onDelete(product); setMenuOpen(false); }}>
                  <Trash2 className="me-2 h-4 w-4" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <button
            type="button"
            onClick={() => onCopySlug(product.slug, product.id)}
            className="flex items-center gap-1 text-xs text-muted-foreground font-mono hover:text-foreground transition-colors mt-0.5"
          >
            <span className="truncate">{product.slug}</span>
            {copiedSlugId === product.id ? (
              <Check className="h-3 w-3 shrink-0 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 shrink-0" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">{Number(product.current_price).toFixed(2)}</span>
          {product.price_after_discount && (
            <span className="text-xs text-muted-foreground line-through">
              {Number(product.price).toFixed(2)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={product.in_stock ? 'text-green-600 text-xs' : 'text-red-600 text-xs'}>
            {product.available_stock} {t('products.stock').toLowerCase()}
          </span>
          <StatusBadge status={product.status} className="text-xs" />
        </div>
      </div>

      <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {product.categories?.map((cat) => (
              <Badge key={cat.id} variant="outline" className="text-xs">
                {cat.name}
              </Badge>
            ))}
          </div>
        <div className="flex items-center gap-1.5">
          {product.has_discount && <Tag className="h-3.5 w-3.5 text-amber-500" />}
          {product.has_flash_sale && <Zap className="h-3.5 w-3.5 text-orange-500" />}
          <span className="text-xs text-muted-foreground">
            {format(new Date(product.created_at), 'PP')}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Skeletons ─── */

function DesktopSkeleton() {
  return (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden lg:table-cell">Slug</TableHead>
            <TableHead className="hidden md:table-cell">SKU</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Categories</TableHead>
            <TableHead className="hidden lg:table-cell">Date</TableHead>
            <TableHead className="hidden md:table-cell">Discount</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-10 w-10 rounded-lg" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-12" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MobileCardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-3 space-y-3">
          <div className="flex items-start gap-3">
            <Skeleton className="h-14 w-14 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
