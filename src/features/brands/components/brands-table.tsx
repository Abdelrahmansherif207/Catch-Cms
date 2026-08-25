import { useState, useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  GripVertical,
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
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { BrandImageCell } from './brand-image-cell';
import { StatusBadge } from '@/shared/components/status-badge';
import { BrandDeleteDialog } from './brand-delete-dialog';
import { useReorderBrands } from '../hooks/use-brands';
import type { Brand } from '../types/brand.types';

interface BrandsTableProps {
  data: Brand[];
  isLoading: boolean;
  onEdit: (brand: Brand) => void;
  onRefresh: () => void;
}

export function BrandsTable({
  data,
  isLoading,
  onEdit,
  onRefresh,
}: BrandsTableProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [optimisticIds, setOptimisticIds] = useState<number[] | null>(null);
  const reorderMutation = useReorderBrands();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const items = optimisticIds ?? data.map((b) => b.id);

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const ids = data.map((s) => s.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    reorderMutation.mutate(ids, { onSuccess: onRefresh });
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const currentIds = optimisticIds ?? data.map((b) => b.id);
      const oldIndex = currentIds.indexOf(Number(active.id));
      const newIndex = currentIds.indexOf(Number(over.id));
      if (oldIndex === -1 || newIndex === -1) return;

      const newIds = arrayMove(currentIds, oldIndex, newIndex);
      setOptimisticIds(newIds);
      reorderMutation.mutate(newIds, {
        onSuccess: () => {
          setOptimisticIds(null);
          onRefresh();
        },
        onError: () => {
          setOptimisticIds(null);
        },
      });
    },
    [data, optimisticIds, reorderMutation, onRefresh]
  );

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
          {data.map((brand, index) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              index={index}
              onMoveUp={handleMoveUp}
              onEdit={onEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
        {deleteTarget && (
          <BrandDeleteDialog
            brandId={deleteTarget.id}
            brandName={deleteTarget.name}
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
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>{t('brands.image')}</TableHead>
                  <TableHead>{t('brands.name')}</TableHead>
                  <TableHead>{t('brands.details')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((id) => {
                  const brand = data.find((b) => b.id === id);
                  if (!brand) return null;
                  return (
                    <SortableTableRow
                      key={brand.id}
                      brand={brand}
                      onEdit={onEdit}
                      onDelete={setDeleteTarget}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      </div>

      {deleteTarget && (
        <BrandDeleteDialog
          brandId={deleteTarget.id}
          brandName={deleteTarget.name}
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

function SortableTableRow({
  brand,
  onEdit,
  onDelete,
}: {
  brand: Brand;
  onEdit: (brand: Brand) => void;
  onDelete: (brand: Brand | null) => void;
}) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: brand.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="p-1">
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </TableCell>
      <TableCell>
        <BrandImageCell image={brand.image} alt={brand.name} />
      </TableCell>
      <TableCell>
        <div className="min-w-0">
          <p className="font-medium truncate">{brand.name}</p>
          <p className="text-xs text-muted-foreground truncate">/{brand.slug}</p>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground line-clamp-2">
          {brand.details || '—'}
        </span>
      </TableCell>
      <TableCell>
        <StatusBadge status={brand.status} />
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(brand)}>
              <Pencil className="me-2 h-4 w-4" />
              {t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(brand)}
            >
              <Trash2 className="me-2 h-4 w-4" />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function BrandCard({ brand, index, onMoveUp, onEdit, onDelete }: { brand: Brand; index: number; onMoveUp: (index: number) => void; onEdit: (brand: Brand) => void; onDelete: (brand: Brand) => void }) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

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
        <BrandImageCell image={brand.image} alt={brand.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium truncate">{brand.name}</p>
              <p className="text-xs text-muted-foreground truncate">/{brand.slug}</p>
            </div>
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { onEdit(brand); setMenuOpen(false); }}>
                  <Pencil className="me-2 h-4 w-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => { onDelete(brand); setMenuOpen(false); }}>
                  <Trash2 className="me-2 h-4 w-4" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">{brand.details || '—'}</p>
      <div className="flex items-center justify-end">
        <StatusBadge status={brand.status} />
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
            <TableHead>Name</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-8 w-6" /></TableCell>
              <TableCell>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1 h-3 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
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
          <Skeleton className="h-3 w-full" />
          <div className="flex items-center justify-end">
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
