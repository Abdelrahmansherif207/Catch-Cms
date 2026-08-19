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
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Skeleton } from '@/shared/ui/skeleton';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { PromotionImageCell } from './promotion-image-cell';
import { PromotionStatusBadge } from './promotion-status-badge';
import { PromotionDeleteDialog } from './promotion-delete-dialog';
import type { Promotion } from '../types/promotion.types';

interface PromotionsTableProps {
  data: Promotion[];
  isLoading: boolean;
  onEdit: (promotion: Promotion) => void;
  onRefresh: () => void;
}

export function PromotionsTable({
  data,
  isLoading,
  onEdit,
  onRefresh,
}: PromotionsTableProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);

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
          {data.map((promotion) => (
            <PromotionCard
              key={promotion.id}
              promotion={promotion}
              onEdit={onEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
        {deleteTarget && (
          <PromotionDeleteDialog
            promotionId={deleteTarget.id}
            promotionName={deleteTarget.name}
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('promotions.image')}</TableHead>
              <TableHead>{t('promotions.name')}</TableHead>
              <TableHead>{t('promotions.type')}</TableHead>
              <TableHead>{t('promotions.discountType')}</TableHead>
              <TableHead>{t('promotions.value')}</TableHead>
              <TableHead>{t('promotions.period')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((promotion) => (
              <TableRow key={promotion.id}>
                <TableCell>
                  <PromotionImageCell image={promotion.image} alt={promotion.name} />
                </TableCell>
                <TableCell>
                  <div className="min-w-0">
                    <p className="font-medium truncate max-w-[180px]">{promotion.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      /{promotion.slug}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{promotion.type}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm capitalize">{promotion.discount_type}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">
                    {promotion.discount_type === 'percentage'
                      ? `${promotion.discount}%`
                      : `${promotion.discount} EGP`}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-muted-foreground">
                    <p>{new Date(promotion.start_at).toLocaleDateString()}</p>
                    <p>{new Date(promotion.end_at).toLocaleDateString()}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <PromotionStatusBadge status={promotion.status} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(promotion)}>
                        <Pencil className="me-2 h-4 w-4" />
                        {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteTarget(promotion)}
                      >
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

      {deleteTarget && (
        <PromotionDeleteDialog
          promotionId={deleteTarget.id}
          promotionName={deleteTarget.name}
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

function PromotionCard({ promotion, onEdit, onDelete }: { promotion: Promotion; onEdit: (promotion: Promotion) => void; onDelete: (promotion: Promotion) => void }) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start gap-3">
        <PromotionImageCell image={promotion.image} alt={promotion.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium truncate">{promotion.name}</p>
              <p className="text-xs text-muted-foreground truncate">/{promotion.slug}</p>
            </div>
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { onEdit(promotion); setMenuOpen(false); }}>
                  <Pencil className="me-2 h-4 w-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => { onDelete(promotion); setMenuOpen(false); }}>
                  <Trash2 className="me-2 h-4 w-4" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs capitalize">{promotion.type}</Badge>
          <span className="text-xs text-muted-foreground capitalize">{promotion.discount_type}</span>
        </div>
        <span className="font-medium">
          {promotion.discount_type === 'percentage'
            ? `${promotion.discount}%`
            : `${promotion.discount} EGP`}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{new Date(promotion.start_at).toLocaleDateString()} &rarr; {new Date(promotion.end_at).toLocaleDateString()}</span>
        <PromotionStatusBadge status={promotion.status} />
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
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-10 w-10 rounded-lg" /></TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1 h-3 w-20" />
              </TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-12" /></TableCell>
              <TableCell>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-1 h-3 w-16" />
              </TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
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
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
