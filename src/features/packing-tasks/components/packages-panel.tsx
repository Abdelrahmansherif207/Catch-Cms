import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, PackagePlus, PackageX, Lock } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  usePackages,
  useCreatePackage,
  useSealPackage,
  usePackage,
} from '@/features/packages/hooks/use-packages';
import { PackageStatusBadge } from '@/features/packages/components/package-status-badge';
import { AddPackageItemDialog } from '@/features/packages/components/add-package-item-dialog';
import { VoidPackageDialog } from '@/features/packages/components/void-package-dialog';
import type { PackageListItem } from '@/features/packages/types/package.types';
import type { FulfillmentItem } from '@/features/fulfillments/types/fulfillment.types';

interface PackagesPanelProps {
  fulfillmentId: number;
  /** The fulfillment's item rows — feeds the add-item remaining math. */
  items: FulfillmentItem[];
}

/**
 * The packer's physical boxes. ONE ACTIVE (non-voided) package per
 * fulfillment — "New package" stays disabled until the box is gone; a
 * voided row never blocks a replacement. Package actions ride raw grant
 * splits: create/add-item/seal = packing-execute, void = manage-fulfillment.
 */
export function PackagesPanel({ fulfillmentId, items }: PackagesPanelProps) {
  const { t } = useTranslation();
  const rawPermissions = useAuthStore((s) => s.user?.permissions ?? []);
  const canExecute = rawPermissions.includes(PERMISSIONS.fulfillments.packingExecute);
  const canManage = rawPermissions.includes(PERMISSIONS.fulfillments.manage);

  const { data, isLoading } = usePackages({ fulfillmentId });
  const packages = data?.data ?? [];
  const hasActive = packages.some((pkg) => pkg.status !== 'voided');

  // The one open package is the add-item target; its detail supplies the
  // packed-quantities for the picker.
  const openPackage = packages.find((pkg) => pkg.status === 'open') ?? null;
  usePackage(openPackage?.id);

  const createMutation = useCreatePackage();
  const sealMutation = useSealPackage();

  const [addItemId, setAddItemId] = useState<number | null>(null);
  const [voidPackageRow, setVoidPackageRow] = useState<PackageListItem | null>(null);

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Package className="h-4 w-4" />
          {t('packages.panelTitle')}
        </h2>
        {canExecute && (
          <span className="flex items-center gap-2">
            {!hasActive ? null : (
              <span className="text-xs text-muted-foreground">{t('packages.newHint')}</span>
            )}
            <Button
              size="sm"
              onClick={() => createMutation.mutate({ fulfillment_id: fulfillmentId })}
              disabled={createMutation.isPending || hasActive}
            >
              <PackagePlus className="me-1.5 h-4 w-4" />
              {createMutation.isPending
                ? t('packages.creating')
                : t('packages.new')}
            </Button>
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : packages.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t('packages.empty')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-start">#</th>
                <th className="px-3 py-2 text-start">{t('packages.barcode')}</th>
                <th className="px-3 py-2 text-start">{t('common.status')}</th>
                <th className="px-3 py-2 text-start">{t('packages.items')}</th>
                <th className="hidden sm:table-cell px-3 py-2 text-start">
                  {t('packingTasks.weight')}
                </th>
                <th className="hidden md:table-cell px-3 py-2 text-start">
                  {t('packages.sealedAt')}
                </th>
                <th className="px-2 py-2 text-end">{t('packingTasks.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {packages.map((pkg) => {
                const isOpen = pkg.status === 'open';
                return (
                  <tr key={pkg.id}>
                    <td className="px-3 py-2 font-mono text-xs">{pkg.package_number}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {pkg.barcode ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      <PackageStatusBadge status={pkg.status} />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{pkg.item_count}</td>
                    <td className="hidden px-3 py-2 font-mono text-xs sm:table-cell">
                      {pkg.weight === null ? '—' : pkg.weight}
                    </td>
                    <td className="hidden px-3 py-2 text-xs text-muted-foreground md:table-cell">
                      {pkg.sealed_at ? formatDate(pkg.sealed_at) : '—'}
                    </td>
                    <td className="px-2 py-2 text-end">
                      {isOpen && canExecute ? (
                        <span className="inline-flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAddItemId(pkg.id)}
                          >
                            <PackagePlus className="me-1 h-3.5 w-3.5" />
                            {t('packages.addItem')}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => sealMutation.mutate({ id: pkg.id })}
                            disabled={sealMutation.isPending || pkg.item_count === 0}
                            title={
                              pkg.item_count === 0 ? t('packages.sealEmptyHint') : undefined
                            }
                          >
                            <Lock className="me-1 h-3.5 w-3.5" />
                            {t('packages.seal')}
                          </Button>
                        </span>
                      ) : null}
                      {isOpen && canManage ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setVoidPackageRow(pkg)}
                        >
                          <PackageX className="me-1 h-3.5 w-3.5" />
                          {t('packages.void')}
                        </Button>
                      ) : null}
                      {!isOpen && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {addItemId !== null && (
        <AddPackageItemDialog
          packageId={addItemId}
          items={items}
          open
          onOpenChange={(open) => {
            if (!open) setAddItemId(null);
          }}
        />
      )}
      {voidPackageRow && (
        <VoidPackageDialog
          pkg={voidPackageRow}
          open
          onOpenChange={(open) => {
            if (!open) setVoidPackageRow(null);
          }}
        />
      )}
    </section>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
