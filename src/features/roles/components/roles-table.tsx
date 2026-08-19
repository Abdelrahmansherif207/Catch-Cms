import { useState, useMemo } from 'react';
import { MoreHorizontal, Eye, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
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
import { RoleDeleteDialog } from './role-delete-dialog';
import { parseDisplayName } from '../schemas/role.schema';
import { roleRoutes } from '../routes/role.routes';
import type { Role } from '../types/role.types';

interface RolesTableProps {
  data: Role[];
  isLoading: boolean;
  isError?: boolean;
  onEdit: (role: Role) => void;
  onRefresh: () => void;
}

type SortField = 'id' | 'displayName';
type SortDir = 'asc' | 'desc';

export function RolesTable({
  data,
  isLoading,
  isError,
  onEdit,
  onRefresh,
}: RolesTableProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const lang = i18n.language || 'en';

  const sorted = useMemo(() => {
    const list = [...data];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'id') {
        cmp = a.id - b.id;
      } else {
        const aLabel = parseDisplayName(a.display_name).en || a.name || '';
        const bLabel = parseDisplayName(b.display_name).en || b.name || '';
        cmp = aLabel.localeCompare(bLabel);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [data, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ms-1 h-3 w-3 inline opacity-40" />;
    return sortDir === 'asc'
      ? <ArrowUp className="ms-1 h-3 w-3 inline" />
      : <ArrowDown className="ms-1 h-3 w-3 inline" />;
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-12">
        <p className="text-sm text-muted-foreground">{t('roles.loadError')}</p>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="me-2 h-4 w-4" />
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  className="inline-flex items-center font-medium"
                  onClick={() => toggleSort('id')}
                >
                  {t('roles.id')}
                  <SortIcon field="id" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="inline-flex items-center font-medium"
                  onClick={() => toggleSort('displayName')}
                >
                  {t('roles.displayName')}
                  <SortIcon field="displayName" />
                </button>
              </TableHead>
              <TableHead>{t('roles.guardName')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  {t('common.noData')}
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((role) => {
                const parsed = parseDisplayName(role.display_name);
                const label = lang === 'ar' && parsed.ar ? parsed.ar : parsed.en || role.name || '';
                return (
                  <TableRow key={role.id}>
                    <TableCell className="text-muted-foreground">{role.id}</TableCell>
                    <TableCell>
                      <span className="font-medium">{label}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">api</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(roleRoutes.detail(role.id))}>
                            <Eye className="me-2 h-4 w-4" />
                            {t('common.view')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(role)}>
                            <Pencil className="me-2 h-4 w-4" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteTarget(role)}
                          >
                            <Trash2 className="me-2 h-4 w-4" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {deleteTarget && (
        <RoleDeleteDialog
          roleId={deleteTarget.id}
          roleName={parseDisplayName(deleteTarget.display_name).en || ''}
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
            <TableHead>ID</TableHead>
            <TableHead>Display Name</TableHead>
            <TableHead>Guard</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-8" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-8" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
