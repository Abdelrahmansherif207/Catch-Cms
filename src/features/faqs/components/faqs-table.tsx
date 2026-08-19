import { useState } from 'react';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  GripVertical,
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
import { Badge } from '@/shared/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Skeleton } from '@/shared/ui/skeleton';
import { FaqDeleteDialog } from './faq-delete-dialog';
import { useReorderFaqs } from '../hooks/use-faqs';
import { cn } from '@/shared/lib/utils';
import type { Faq } from '../types/faq.types';

interface FaqsTableProps {
  data: Faq[];
  isLoading: boolean;
  onEdit: (faq: Faq) => void;
  onRefresh: () => void;
}

function SortableRow({
  faq,
  onEdit,
  onDelete,
}: {
  faq: Faq;
  onEdit: (faq: Faq) => void;
  onDelete: (faq: Faq) => void;
}) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: faq.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const parsedTitle: Record<string, string> = (() => {
    try {
      return typeof faq.faq_title === 'string' ? JSON.parse(faq.faq_title) : faq.faq_title;
    } catch {
      return { en: faq.faq_title, ar: faq.faq_title };
    }
  })();

  const parsedDescription: Record<string, string> = (() => {
    try {
      return typeof faq.faq_description === 'string' ? JSON.parse(faq.faq_description) : faq.faq_description;
    } catch {
      return { en: faq.faq_description, ar: faq.faq_description };
    }
  })();

  const displayTitle = parsedTitle.en || parsedTitle.ar || faq.faq_title;
  const displayDescription = parsedDescription.en || parsedDescription.ar || faq.faq_description;

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
        {faq.order}
      </TableCell>
      <TableCell>
        <div className="min-w-0">
          <p className="font-medium truncate max-w-[250px]">{displayTitle}</p>
        </div>
      </TableCell>
      <TableCell>
        <p className="text-sm text-muted-foreground truncate max-w-[300px]">
          {displayDescription}
        </p>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cn(
          'text-xs font-normal',
          faq.faq_type === 'global'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
        )}>
          {faq.faq_type === 'global' ? t('faqs.global') : t('faqs.shop')}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={cn(
            'text-xs font-normal',
            faq.status
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          )}
        >
          {faq.status ? t('faqs.active') : t('faqs.inactive')}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(faq)}>
              <Pencil className="me-2 h-4 w-4" />
              {t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(faq)}
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

export function FaqsTable({
  data,
  isLoading,
  onEdit,
  onRefresh,
}: FaqsTableProps) {
  const { t } = useTranslation();
  const [deleteTarget, setDeleteTarget] = useState<Faq | null>(null);
  const reorderMutation = useReorderFaqs();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  if (isLoading) {
    return <TableSkeleton />;
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
                <TableHead>{t('faqs.title')}</TableHead>
                <TableHead>{t('faqs.description')}</TableHead>
                <TableHead>{t('faqs.type')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                <SortableContext
                  items={data.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {data.map((faq) => (
                    <SortableRow
                      key={faq.id}
                      faq={faq}
                      onEdit={onEdit}
                      onDelete={() => setDeleteTarget(faq)}
                    />
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {deleteTarget && (
        <FaqDeleteDialog
          faqId={deleteTarget.id}
          faqTitle={deleteTarget.faq_title}
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
            <TableHead className="w-10" />
            <TableHead className="w-10">#</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-8 w-6" /></TableCell>
              <TableCell><Skeleton className="h-4 w-6" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-48" /></TableCell>
              <TableCell><Skeleton className="h-5 w-14" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-8 w-20" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
