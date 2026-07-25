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
import { Badge } from '@/shared/ui/badge';
import { SectionTypeBadge } from './section-type-badge';
import { SectionDeleteDialog } from './section-delete-dialog';
import { useToggleSectionActive, useReorderSections } from '../hooks/use-sections';
import type { Section } from '../types/section.types';

interface SectionsTableProps {
  data: Section[];
  isLoading: boolean;
  onEdit: (section: Section) => void;
  onRefresh: () => void;
}

// ─── Sortable Row ────────────────────────────────────────────────

function SortableRow({
  section,
  onEdit,
  onChangeStatus,
  onDelete,
  isPendingStatus,
}: {
  section: Section;
  onEdit: (section: Section) => void;
  onChangeStatus: (section: Section) => void;
  onDelete: (section: Section) => void;
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
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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
      <TableCell className="text-sm text-muted-foreground w-10">
        {section.order}
      </TableCell>
      <TableCell>
        <SectionTypeBadge type={section.type} />
      </TableCell>
      <TableCell>
        <div className="min-w-0">
          <p className="font-medium truncate">{section.title}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[250px]">
            {section.endpoint}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={
            section.is_active
              ? 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400'
              : 'border-muted bg-muted/50 text-muted-foreground'
          }
        >
          {section.is_active ? t('sections.active') : t('sections.inactive')}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onChangeStatus(section)}
            disabled={isPendingStatus}
            title={section.is_active ? t('sections.deactivate') : t('sections.activate')}
          >
            {section.is_active ? (
              <Power className="h-4 w-4 text-green-600" />
            ) : (
              <PowerOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(section)}>
                <Pencil className="me-2 h-4 w-4" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(section)}
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

// ─── Sections Table ──────────────────────────────────────────────

export function SectionsTable({
  data,
  isLoading,
  onEdit,
  onRefresh,
}: SectionsTableProps) {
  const { t } = useTranslation();
  const [deleteTarget, setDeleteTarget] = useState<Section | null>(null);
  const toggleMutation = useToggleSectionActive();
  const reorderMutation = useReorderSections();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleToggleStatus = (section: Section) => {
    toggleMutation.mutate(section.id, {
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
                <TableHead>{t('sections.type')}</TableHead>
                <TableHead>{t('sections.title')}</TableHead>
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
                  {data.map((section) => (
                    <SortableRow
                      key={section.id}
                      section={section}
                      onEdit={onEdit}
                      onChangeStatus={handleToggleStatus}
                      onDelete={() => setDeleteTarget(section)}
                      isPendingStatus={toggleMutation.isPending}
                    />
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {deleteTarget && (
        <SectionDeleteDialog
          sectionId={deleteTarget.id}
          sectionTitle={deleteTarget.title}
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

// ─── Skeleton ────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead className="w-10">#</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 6 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-8 w-6" /></TableCell>
              <TableCell><Skeleton className="h-4 w-6" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1 h-3 w-48" />
              </TableCell>
              <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-8 w-20" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
