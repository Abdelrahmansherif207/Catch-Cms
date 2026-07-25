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
import { BannerImageCell } from './banner-image-cell';
import { BannerStatusBadge } from './banner-status-badge';
import { BannerDeleteDialog } from './banner-delete-dialog';
import type { Banner } from '../types/banner.types';

interface BannersTableProps {
  data: Banner[];
  isLoading: boolean;
  onEdit: (banner: Banner) => void;
  onRefresh: () => void;
}

export function BannersTable({
  data,
  isLoading,
  onEdit,
  onRefresh,
}: BannersTableProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

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
          {data.map((banner) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              onEdit={onEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
        {deleteTarget && (
          <BannerDeleteDialog
            bannerId={deleteTarget.id}
            bannerTitle={deleteTarget.title}
            open={!!deleteTarget}
            onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
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
              <TableHead>{t('banners.image')}</TableHead>
              <TableHead>{t('banners.title')}</TableHead>
              <TableHead>{t('banners.description')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((banner) => {
              const parsedTitle: Record<string, string> = (() => {
                try { return typeof banner.title === 'string' ? JSON.parse(banner.title) : banner.title; }
                catch { return { en: banner.title, ar: banner.title }; }
              })();
              const displayTitle = parsedTitle.en || parsedTitle.ar || banner.title;
              const parsedDescription: Record<string, string> = (() => {
                try { return typeof banner.description === 'string' ? JSON.parse(banner.description) : banner.description; }
                catch { return { en: banner.description, ar: banner.description }; }
              })();
              const displayDesc = parsedDescription.en || parsedDescription.ar || banner.description;

              return (
                <TableRow key={banner.id}>
                  <TableCell>
                    <BannerImageCell image={banner.image} alt={displayTitle} />
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="font-medium truncate max-w-[200px]">{displayTitle}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground truncate max-w-[300px]">{displayDesc}</p>
                  </TableCell>
                  <TableCell>
                    <BannerStatusBadge status={banner.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(banner)}>
                          <Pencil className="me-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteTarget(banner)}
                        >
                          <Trash2 className="me-2 h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {deleteTarget && (
        <BannerDeleteDialog
          bannerId={deleteTarget.id}
          bannerTitle={deleteTarget.title}
          open={!!deleteTarget}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
          onDeleted={onRefresh}
        />
      )}
    </>
  );
}

function BannerCard({ banner, onEdit, onDelete }: { banner: Banner; onEdit: (banner: Banner) => void; onDelete: (banner: Banner) => void }) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const parsedTitle: Record<string, string> = (() => {
    try { return typeof banner.title === 'string' ? JSON.parse(banner.title) : banner.title; }
    catch { return { en: banner.title, ar: banner.title }; }
  })();
  const displayTitle = parsedTitle.en || parsedTitle.ar || banner.title;
  const parsedDescription: Record<string, string> = (() => {
    try { return typeof banner.description === 'string' ? JSON.parse(banner.description) : banner.description; }
    catch { return { en: banner.description, ar: banner.description }; }
  })();
  const displayDesc = parsedDescription.en || parsedDescription.ar || banner.description;

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start gap-3">
        <BannerImageCell image={banner.image} alt={displayTitle} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium truncate">{displayTitle}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{displayDesc}</p>
            </div>
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { onEdit(banner); setMenuOpen(false); }}>
                  <Pencil className="me-2 h-4 w-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => { onDelete(banner); setMenuOpen(false); }}>
                  <Trash2 className="me-2 h-4 w-4" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end">
        <BannerStatusBadge status={banner.status} />
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
            <TableHead>Image</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-10 w-10 rounded-lg" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-48" /></TableCell>
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
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
