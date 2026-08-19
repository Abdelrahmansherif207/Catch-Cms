import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
import { TagImageCell } from './tag-image-cell';
import { TagDeleteDialog } from './tag-delete-dialog';
import type { Tag } from '../types/tag.types';

interface TagsTableProps {
  data: Tag[];
  isLoading: boolean;
  onEdit: (tag: Tag) => void;
  onRefresh: () => void;
}

export function TagsTable({ data, isLoading, onEdit, onRefresh }: TagsTableProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);

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

  return (
    <>
      {isMobile ? (
        <div className="space-y-3">
          {data.map((tag) => (
            <TagCard key={tag.id} tag={tag} onEdit={onEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t('tags.image')}</TableHead>
                <TableHead>{t('tags.name')}</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>{t('tags.icon')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <TagImageCell src={tag.image} alt={tag.name} />
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{tag.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground truncate">/{tag.slug}</p>
                  </TableCell>
                  <TableCell>
                    <TagImageCell src={tag.icon} alt={`${tag.name} icon`} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(tag)}>
                          <Pencil className="me-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(tag)}>
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
      )}

      {deleteTarget && (
        <TagDeleteDialog
          tagId={deleteTarget.id}
          tagName={deleteTarget.name}
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

function TagCard({
  tag,
  onEdit,
  onDelete,
}: {
  tag: Tag;
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
}) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start gap-3">
        <TagImageCell src={tag.image} alt={tag.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium truncate">{tag.name}</p>
              <p className="text-xs text-muted-foreground truncate">/{tag.slug}</p>
            </div>
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { onEdit(tag); setMenuOpen(false); }}>
                  <Pencil className="me-2 h-4 w-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => { onDelete(tag); setMenuOpen(false); }}>
                  <Trash2 className="me-2 h-4 w-4" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
            <TableHead className="w-16">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Icon</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-10 w-10 rounded-lg" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-3 w-20" /></TableCell>
              <TableCell><Skeleton className="h-10 w-10 rounded-lg" /></TableCell>
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
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
