import { useState } from 'react';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  GripVertical,
  Loader2,
  Plus,
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
import { sectionTitle } from '../../lib/static-page-utils';
import { useReorderStaticPageSections } from '../../hooks/use-static-pages';
import { SectionDeleteDialog } from './section-delete-dialog';
import type { Language } from '@/shared/constants/api';
import type { StaticPageSection } from '../../types/static-page.types';

interface SectionsTableProps {
  slug: string;
  data: StaticPageSection[];
  isLoading: boolean;
  lang: Language;
  onEdit: (section: StaticPageSection) => void;
  onAdd: () => void;
  onRefresh: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function SectionsTable({
  slug,
  data,
  isLoading,
  lang,
  onEdit,
  onAdd,
  onRefresh,
  canEdit,
  canDelete,
}: SectionsTableProps) {
  const { t } = useTranslation();
  const [deleteTarget, setDeleteTarget] = useState<StaticPageSection | null>(null);
  const reorderMutation = useReorderStaticPageSections(slug);

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
    reorderMutation.mutate(
      newData.map((s) => s.id),
      { onSuccess: onRefresh }
    );
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border">
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">{t('staticPages.noSections')}</p>
          {canEdit && (
            <Button onClick={onAdd}>
              <Plus className="me-1.5 h-4 w-4" />
              {t('staticPages.addSection')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead className="w-10">#</TableHead>
                <TableHead>{t('staticPages.title')}</TableHead>
                <TableHead>{t('staticPages.contentKeys')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={data.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {data.map((section) => (
                  <SortableRow
                    key={section.id}
                    section={section}
                    lang={lang}
                    onEdit={onEdit}
                    onDelete={setDeleteTarget}
                    canEdit={canEdit}
                    canDelete={canDelete}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
        {reorderMutation.isPending && (
          <div className="flex items-center justify-end gap-1.5 border-t px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t('staticPages.savingOrder')}
          </div>
        )}
      </div>

      {deleteTarget && (
        <SectionDeleteDialog
          slug={slug}
          sectionId={deleteTarget.id}
          sectionTitle={sectionTitle(deleteTarget, lang)}
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

function SortableRow({
  section,
  lang,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: {
  section: StaticPageSection;
  lang: Language;
  onEdit: (section: StaticPageSection) => void;
  onDelete: (section: StaticPageSection) => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const contentKeys = Object.keys(section.content ?? {})
    .map((l) => l.toUpperCase())
    .join(', ');

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'z-10 bg-muted' : ''}
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
      <TableCell className="text-sm text-muted-foreground w-10">{section.order}</TableCell>
      <TableCell>
        <p className="font-medium truncate">{sectionTitle(section, lang)}</p>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{contentKeys || '—'}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEdit && (
              <DropdownMenuItem onClick={() => onEdit(section)}>
                <Pencil className="me-2 h-4 w-4" />
                {t('common.edit')}
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(section)}>
                <Trash2 className="me-2 h-4 w-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function TableSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead className="w-10">#</TableHead>
            <TableHead>{t('staticPages.title')}</TableHead>
            <TableHead>{t('staticPages.content')}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 4 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-8 w-6" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-6" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
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