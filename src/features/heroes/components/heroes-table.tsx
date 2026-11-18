import { useState } from 'react';
import { Film, Image as ImageIcon, MoreHorizontal, Pencil, Power, Trash2 } from 'lucide-react';
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
import { StatusBadge } from '@/shared/components/status-badge';
import { DataEmptyState } from '@/shared/components/data-state';
import { HeroMediaCell } from './hero-media-cell';
import { HeroDeleteDialog } from './hero-delete-dialog';
import { heroDescriptionOf, useToggleHeroActive } from '../hooks/use-heroes';
import type { Hero } from '../types/hero.types';

interface HeroesTableProps {
  data: Hero[];
  isLoading: boolean;
  onEdit: (hero: Hero) => void;
  onRefresh: () => void;
}

export function HeroesTable({ data, isLoading, onEdit, onRefresh }: HeroesTableProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [deleteTarget, setDeleteTarget] = useState<Hero | null>(null);
  const toggleMutation = useToggleHeroActive();

  if (isLoading) {
    return isMobile ? <MobileCardSkeleton /> : <TableSkeleton />;
  }

  if (data.length === 0) {
    return <DataEmptyState />;
  }

  const rowMenu = (hero: Hero) => (
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => onEdit(hero)}>
        <Pencil className="me-2 h-4 w-4" />
        {t('common.edit')}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => toggleMutation.mutate(hero.id)}>
        <Power className="me-2 h-4 w-4" />
        {hero.is_active ? t('heroes.deactivate') : t('heroes.activate')}
      </DropdownMenuItem>
      <DropdownMenuItem
        className="text-destructive"
        onClick={() => setDeleteTarget(hero)}
      >
        <Trash2 className="me-2 h-4 w-4" />
        {t('common.delete')}
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          {data.map((hero) => {
            const description = heroDescriptionOf(hero);
            const displayDesc = description.en || description.ar || hero.description || '';
            return (
              <div key={hero.id} className="rounded-2xl border bg-card p-4 space-y-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <HeroMediaCell hero={hero} />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium uppercase text-muted-foreground">
                        {hero.type}
                      </span>
                      <StatusBadge status={hero.is_active} />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{displayDesc}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t('common.actions')}
                        />
                      }
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    {rowMenu(hero)}
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
        {deleteTarget && (
          <HeroDeleteDialog
            heroId={deleteTarget.id}
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
      <div className="rounded-2xl border bg-card shadow-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('heroes.media')}</TableHead>
              <TableHead>{t('heroes.heroType')}</TableHead>
              <TableHead>{t('heroes.description')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((hero) => {
              const description = heroDescriptionOf(hero);
              const displayDesc = description.en || description.ar || hero.description || '';
              const isToggling = toggleMutation.isPending && toggleMutation.variables === hero.id;
              return (
                <TableRow key={hero.id}>
                  <TableCell>
                    <HeroMediaCell hero={hero} />
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  {hero.type === 'video' ? <Film className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                  <span className="capitalize">{hero.type}</span>
                </span>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground truncate max-w-[300px]">{displayDesc}</p>
                  </TableCell>
                  <TableCell>
                    <span className={isToggling ? 'animate-pulse' : undefined}>
                      <StatusBadge status={hero.is_active} />
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t('common.actions')}
                          />
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      {rowMenu(hero)}
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {deleteTarget && (
        <HeroDeleteDialog
          heroId={deleteTarget.id}
          open={!!deleteTarget}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
          onDeleted={onRefresh}
        />
      )}
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-2xl border bg-card shadow-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Media</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 4 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-14 w-24 rounded-lg" /></TableCell>
              <TableCell><Skeleton className="h-4 w-14" /></TableCell>
              <TableCell><Skeleton className="h-4 w-40" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-8 w-10" /></TableCell>
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
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-card p-4 space-y-3 shadow-xs">
          <div className="flex items-start gap-3">
            <Skeleton className="h-14 w-24 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
