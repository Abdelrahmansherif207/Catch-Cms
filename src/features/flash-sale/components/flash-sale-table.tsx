import { useState } from 'react';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  GripVertical,
  Circle,
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
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Skeleton } from '@/shared/ui/skeleton';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { FlashSaleImageCell } from './flash-sale-image-cell';
import { FlashSaleStatusBadge } from './flash-sale-status-badge';
import { FlashSaleDeleteDialog } from './flash-sale-delete-dialog';
import { useReorderFlashSales } from '../hooks/use-flash-sale';
import type { FlashSale } from '../types/flash-sale.types';

interface FlashSaleTableProps {
  data: FlashSale[];
  isLoading: boolean;
  onEdit: (flashSale: FlashSale) => void;
  onRefresh: () => void;
}

export function FlashSaleTable({
  data,
  isLoading,
  onEdit,
  onRefresh,
}: FlashSaleTableProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [deleteTarget, setDeleteTarget] = useState<FlashSale | null>(null);
  const reorderMutation = useReorderFlashSales();

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const ids = data.map((s) => s.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    reorderMutation.mutate(ids, { onSuccess: onRefresh });
  };

  function formatDate(dateStr: string): string {
    return dateStr ? dateStr.split('T')[0] : '';
  }

  if (isLoading) {
    return isMobile ? <MobileCardSkeleton /> : <TableSkeleton />;
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
          {data.map((sale, index) => (
            <FlashSaleCard
              key={sale.id}
              sale={sale}
              index={index}
              onMoveUp={handleMoveUp}
              onEdit={onEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
        {deleteTarget && (
          <FlashSaleDeleteDialog
            flashSaleId={deleteTarget.id}
            flashSaleTitle={deleteTarget.title}
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

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>{t('flashSale.image')}</TableHead>
              <TableHead>{t('flashSale.title')}</TableHead>
              <TableHead>{t('flashSale.type')}</TableHead>
              <TableHead>{t('flashSale.discount')}</TableHead>
              <TableHead>{t('flashSale.dates')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((sale, index) => (
              <TableRow key={sale.id}>
                <TableCell className="p-1">
                  <div className="flex flex-col items-center gap-0.5">
                    <button
                      type="button"
                      className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <GripVertical className="h-3.5 w-3.5 rotate-0" />
                    </button>
                  </div>
                </TableCell>
                <TableCell>
                  <FlashSaleImageCell image={sale.image} alt={sale.title} />
                </TableCell>
                <TableCell>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{sale.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      /{sale.slug}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{sale.type}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {sale.discount}
                    {sale.max_discount_amount && sale.type.toLowerCase().includes('percentage')
                      ? ' (' + sale.max_discount_amount + ' max)'
                      : ''}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(sale.start_date)} &rarr; {formatDate(sale.end_date)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <FlashSaleStatusBadge status={sale.status} />
                    {sale.is_valid && (
                      <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(sale)}>
                        <Pencil className="me-2 h-4 w-4" />
                        {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteTarget(sale)}
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
        <FlashSaleDeleteDialog
          flashSaleId={deleteTarget.id}
          flashSaleTitle={deleteTarget.title}
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

function FlashSaleCard({ sale, index, onMoveUp, onEdit, onDelete }: { sale: FlashSale; index: number; onMoveUp: (index: number) => void; onEdit: (sale: FlashSale) => void; onDelete: (sale: FlashSale) => void }) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  function formatDate(dateStr: string): string {
    return dateStr ? dateStr.split('T')[0] : '';
  }

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-1 cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30 shrink-0"
          onClick={() => onMoveUp(index)}
          disabled={index === 0}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <FlashSaleImageCell image={sale.image} alt={sale.title} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium truncate">{sale.title}</p>
              <p className="text-xs text-muted-foreground truncate">/{sale.slug}</p>
            </div>
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { onEdit(sale); setMenuOpen(false); }}>
                  <Pencil className="me-2 h-4 w-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => { onDelete(sale); setMenuOpen(false); }}>
                  <Trash2 className="me-2 h-4 w-4" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <Badge variant="outline" className="text-xs">{sale.type}</Badge>
        <span className="font-medium">
          {sale.discount}
          {sale.max_discount_amount && sale.type.toLowerCase().includes('percentage')
            ? ' (' + sale.max_discount_amount + ' max)'
            : ''}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDate(sale.start_date)} &rarr; {formatDate(sale.end_date)}</span>
        <div className="flex items-center gap-1.5">
          <FlashSaleStatusBadge status={sale.status} />
          {sale.is_valid && (
            <Circle className="h-2 w-2 fill-green-500 text-green-500" />
          )}
        </div>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Image</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-8 w-6" /></TableCell>
              <TableCell><Skeleton className="h-10 w-10 rounded-lg" /></TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1 h-3 w-20" />
              </TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
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
            <Skeleton className="h-4 w-4 shrink-0" />
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
