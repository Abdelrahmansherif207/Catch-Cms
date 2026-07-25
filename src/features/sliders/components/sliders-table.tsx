import { useState } from 'react';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  GripVertical,
  Power,
  PowerOff,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { SliderImageCell } from './slider-image-cell';
import { SliderStatusBadge } from './slider-status-badge';
import { SliderDeleteDialog } from './slider-delete-dialog';
import { useChangeSliderStatus, useReorderSliders } from '../hooks/use-sliders';
import type { Slider } from '../types/slider.types';

interface SlidersTableProps {
  data: Slider[];
  isLoading: boolean;
  onEdit: (slider: Slider) => void;
  onRefresh: () => void;
}

function SortableRow({
  slider,
  onEdit,
  onChangeStatus,
  onDelete,
  isPendingStatus,
}: {
  slider: Slider;
  index: number;
  onEdit: (slider: Slider) => void;
  onChangeStatus: (slider: Slider) => void;
  onDelete: (slider: Slider) => void;
  isPendingStatus: boolean;
}) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slider.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? "z-10 bg-muted" : ""}
    >
      <TableCell className="p-1 w-10">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground w-10">
        {slider.order}
      </TableCell>
      <TableCell>
        <SliderImageCell image={slider.image} alt={slider.title} />
      </TableCell>
      <TableCell>
        <div className="min-w-0">
          <p className="font-medium truncate">{slider.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            /{slider.slug}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <SliderStatusBadge status={slider.status} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onChangeStatus(slider)}
            disabled={isPendingStatus}
            title={slider.status ? t('sliders.deactivate') : t('sliders.activate')}
          >
            {slider.status ? <Power className="h-4 w-4 text-green-600" /> : <PowerOff className="h-4 w-4 text-muted-foreground" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(slider)}>
                <Pencil className="me-2 h-4 w-4" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(slider)}
              >
                <Trash2 className="me-2 h-4 w-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function SlidersTable({
  data,
  isLoading,
  onEdit,
  onRefresh,
}: SlidersTableProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [deleteTarget, setDeleteTarget] = useState<Slider | null>(null);
  const changeStatusMutation = useChangeSliderStatus();
  const reorderMutation = useReorderSliders();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleToggleStatus = (slider: Slider) => {
    changeStatusMutation.mutate(slider.id, {
      onSuccess: onRefresh,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = data.findIndex((s) => s.id === active.id);
    const newIndex = data.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newData = arrayMove(data, oldIndex, newIndex);
    const ids = newData.map((s) => s.id);
    reorderMutation.mutate(ids, { onSuccess: onRefresh });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const ids = data.map((s) => s.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    reorderMutation.mutate(ids, { onSuccess: onRefresh });
  };

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
          {data.map((slider, index) => (
            <SliderCard
              key={slider.id}
              slider={slider}
              index={index}
              onMoveUp={handleMoveUp}
              onEdit={onEdit}
              onToggleStatus={handleToggleStatus}
              onDelete={setDeleteTarget}
              isPendingStatus={changeStatusMutation.isPending}
            />
          ))}
        </div>
        {deleteTarget && (
          <SliderDeleteDialog
            sliderId={deleteTarget.id}
            sliderTitle={deleteTarget.title}
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead className="w-10">#</TableHead>
                <TableHead>{t('sliders.image')}</TableHead>
                <TableHead>{t('sliders.title')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                <SortableContext
                  items={data.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {data.map((slider, index) => (
                    <SortableRow
                      key={slider.id}
                      slider={slider}
                      index={index}
                      onEdit={onEdit}
                      onChangeStatus={handleToggleStatus}
                      onDelete={() => setDeleteTarget(slider)}
                      isPendingStatus={changeStatusMutation.isPending}
                    />
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {deleteTarget && (
        <SliderDeleteDialog
          sliderId={deleteTarget.id}
          sliderTitle={deleteTarget.title}
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

function SliderCard({ slider, index, onMoveUp, onEdit, onToggleStatus, onDelete, isPendingStatus }: { slider: Slider; index: number; onMoveUp: (index: number) => void; onEdit: (slider: Slider) => void; onToggleStatus: (slider: Slider) => void; onDelete: (slider: Slider) => void; isPendingStatus: boolean }) {
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
        <SliderImageCell image={slider.image} alt={slider.title} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium truncate">{slider.title}</p>
              <p className="text-xs text-muted-foreground truncate">/{slider.slug}</p>
            </div>
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { onEdit(slider); setMenuOpen(false); }}>
                  <Pencil className="me-2 h-4 w-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => { onDelete(slider); setMenuOpen(false); }}>
                  <Trash2 className="me-2 h-4 w-4" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">#{slider.order}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onToggleStatus(slider)}
            disabled={isPendingStatus}
            title={slider.status ? t('sliders.deactivate') : t('sliders.activate')}
          >
            {slider.status ? <Power className="h-4 w-4 text-green-600" /> : <PowerOff className="h-4 w-4 text-muted-foreground" />}
          </Button>
          <SliderStatusBadge status={slider.status} />
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
            <TableHead className="w-10">#</TableHead>
            <TableHead>Image</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-8 w-6" /></TableCell>
              <TableCell><Skeleton className="h-4 w-6" /></TableCell>
              <TableCell><Skeleton className="h-10 w-10 rounded-lg" /></TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1 h-3 w-20" />
              </TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-8 w-20" /></TableCell>
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
            <Skeleton className="h-3 w-8" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
