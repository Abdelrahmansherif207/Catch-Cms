import { useState } from 'react';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLocalizedName } from '@/shared/lib/localize';
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
import { AttributeDeleteDialog } from './attribute-delete-dialog';
import type { Attribute } from '../types/attribute.types';

interface AttributesTableProps {
  data: Attribute[];
  isLoading: boolean;
  onEdit: (attribute: Attribute) => void;
  onRefresh: () => void;
}

export function AttributesTable({
  data,
  isLoading,
  onEdit,
  onRefresh,
}: AttributesTableProps) {
  const { t, i18n } = useTranslation();
  const [deleteTarget, setDeleteTarget] = useState<Attribute | null>(null);

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('attributes.id')}</TableHead>
              <TableHead>{t('attributes.name')}</TableHead>
              <TableHead>{t('attributes.slug')}</TableHead>
              <TableHead>{t('attributes.values')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t('common.noData')}
                </TableCell>
              </TableRow>
            ) : (
              data.map((attr) => (
                <TableRow key={attr.id}>
                  <TableCell className="text-xs text-muted-foreground">{attr.id}</TableCell>
                  <TableCell className="font-medium">{getLocalizedName(attr.name, i18n.language || 'en')}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      {attr.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {!attr.values || attr.values.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        attr.values.map((v) => (
                          <Badge key={v.id} variant="secondary" className="text-xs">
                            {v.value}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(attr)}>
                          <Pencil className="me-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteTarget(attr)}
                        >
                          <Trash2 className="me-2 h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {deleteTarget && (
        <AttributeDeleteDialog
          attributeId={deleteTarget.id}
          attributeName={deleteTarget.name}
          valuesCount={deleteTarget.values?.length}
          open={!!deleteTarget}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
          onDeleted={onRefresh}
        />
      )}
    </>
  );
}

function TableSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('attributes.id')}</TableHead>
            <TableHead>{t('attributes.name')}</TableHead>
            <TableHead>{t('attributes.slug')}</TableHead>
            <TableHead>{t('attributes.values')}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-8" /></TableCell>
              <TableCell><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-5 w-32" /></TableCell>
              <TableCell><Skeleton className="h-8 w-20" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
