import { useState } from 'react';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
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
import { CouponImageCell } from './coupon-image-cell';
import { CouponStatusBadge } from './coupon-status-badge';
import { CouponDeleteDialog } from './coupon-delete-dialog';
import type { Coupon } from '../types/coupon.types';

interface CouponsTableProps {
  data: Coupon[];
  isLoading: boolean;
  onEdit: (coupon: Coupon) => void;
  onRefresh: () => void;
}

function formatDate(dateStr: string): string {
  return dateStr ? dateStr.split('T')[0] : '';
}

export function CouponsTable({
  data,
  isLoading,
  onEdit,
  onRefresh,
}: CouponsTableProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

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
          {data.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              onEdit={onEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
        {deleteTarget && (
          <CouponDeleteDialog
            couponId={deleteTarget.id}
            couponCode={deleteTarget.code}
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
              <TableHead>{t('coupons.image')}</TableHead>
              <TableHead>{t('coupons.code')}</TableHead>
              <TableHead>{t('coupons.name')}</TableHead>
              <TableHead>{t('coupons.discount')}</TableHead>
              <TableHead>{t('coupons.dates')}</TableHead>
              <TableHead>{t('coupons.usage')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((coupon) => {
              const parsedName: Record<string, string> = (() => {
                try {
                  return typeof coupon.name === 'string' ? JSON.parse(coupon.name) : coupon.name;
                } catch {
                  return { en: coupon.name, ar: coupon.name };
                }
              })();
              const displayName = parsedName.en || parsedName.ar || coupon.name;

              return (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <CouponImageCell image={coupon.image} alt={displayName} />
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      {coupon.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="font-medium truncate max-w-[200px]">{displayName}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{Number(coupon.discount).toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">{coupon.discount_type}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      <p>{formatDate(coupon.start_date)}</p>
                      <p>{formatDate(coupon.end_date)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-center">
                      <p className="font-medium">{coupon.used}</p>
                      <p className="text-xs text-muted-foreground">/ {coupon.limiter ?? '\u221E'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <CouponStatusBadge status={coupon.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(coupon)}>
                          <Pencil className="me-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteTarget(coupon)}
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
        <CouponDeleteDialog
          couponId={deleteTarget.id}
          couponCode={deleteTarget.code}
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

function CouponCard({ coupon, onEdit, onDelete }: { coupon: Coupon; onEdit: (coupon: Coupon) => void; onDelete: (coupon: Coupon) => void }) {
  const { t } = useTranslation();
  const parsedName: Record<string, string> = (() => {
    try {
      return typeof coupon.name === 'string' ? JSON.parse(coupon.name) : coupon.name;
    } catch {
      return { en: coupon.name, ar: coupon.name };
    }
  })();
  const displayName = parsedName.en || parsedName.ar || coupon.name;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start gap-3">
        <CouponImageCell image={coupon.image} alt={displayName} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium truncate">{displayName}</p>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono mt-0.5 inline-block">
                {coupon.code}
              </code>
            </div>
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { onEdit(coupon); setMenuOpen(false); }}>
                  <Pencil className="me-2 h-4 w-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => { onDelete(coupon); setMenuOpen(false); }}>
                  <Trash2 className="me-2 h-4 w-4" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="font-medium">{Number(coupon.discount).toFixed(1)}</span>
          <span className="text-xs text-muted-foreground ms-1">{coupon.discount_type}</span>
        </div>
        <CouponStatusBadge status={coupon.status} />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDate(coupon.start_date)} &rarr; {formatDate(coupon.end_date)}</span>
        <span>{t('coupons.usedCount', { used: coupon.used, total: coupon.limiter ?? '\u221E' })}</span>
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
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-10 w-10 rounded-lg" /></TableCell>
              <TableCell><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-12" /></TableCell>
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
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
