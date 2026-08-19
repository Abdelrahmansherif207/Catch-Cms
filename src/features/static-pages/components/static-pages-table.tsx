import { useState } from 'react';
import { MoreHorizontal, Pencil, Eye, LayoutList } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { localizedText } from '../lib/static-page-utils';
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
import { StaticPageStatusBadge } from './static-page-status-badge';
import type { StaticPage } from '../types/static-page.types';

interface StaticPagesTableProps {
  data: StaticPage[];
  isLoading: boolean;
  onEdit: (page: StaticPage) => void;
  onViewSections: (page: StaticPage) => void;
  onPreview: (page: StaticPage) => void;
  canUpdate: boolean;
}

export function StaticPagesTable({
  data,
  isLoading,
  onEdit,
  onViewSections,
  onPreview,
  canUpdate,
}: StaticPagesTableProps) {
  const { t, i18n } = useTranslation();
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('staticPages.slug')}</TableHead>
            <TableHead>{t('staticPages.title')}</TableHead>
            <TableHead>{t('staticPages.sections')}</TableHead>
            <TableHead>{t('common.status')}</TableHead>
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
            data.map((page) => (
              <TableRow key={page.id}>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  /{page.slug}
                </TableCell>
                <TableCell>
                  <p className="font-medium">
                    {localizedText(page.title, i18n.language === 'ar' ? 'ar' : 'en')}
                  </p>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {page.sections?.length ?? 0}
                </TableCell>
                <TableCell>
                  <StaticPageStatusBadge isActive={page.is_active} />
                </TableCell>
                <TableCell>
                  <DropdownMenu
                    open={menuOpenId === page.id}
                    onOpenChange={(open) => setMenuOpenId(open ? page.id : null)}
                  >
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewSections(page)}>
                        <LayoutList className="me-2 h-4 w-4" />
                        {t('staticPages.manageSections')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPreview(page)}>
                        <Eye className="me-2 h-4 w-4" />
                        {t('staticPages.preview')}
                      </DropdownMenuItem>
                      {canUpdate && (
                        <DropdownMenuItem onClick={() => onEdit(page)}>
                          <Pencil className="me-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function TableSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('staticPages.slug')}</TableHead>
            <TableHead>{t('staticPages.title')}</TableHead>
            <TableHead>{t('staticPages.sections')}</TableHead>
            <TableHead>{t('common.status')}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16 rounded-full" />
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