import { useState } from 'react';
import { Search, ShieldX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { usePermissions } from '../hooks/use-roles';

type FilterMode = 'all' | 'selected' | 'unselected';

interface RolePermissionsGridProps {
  selectedIds: number[];
  onToggle: (permissionId: number) => void;
}

export function RolePermissionsGrid({ selectedIds, onToggle }: RolePermissionsGridProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const { data: permissionsData, isLoading, isError, error } = usePermissions();

  const isForbidden = isError && (error as any)?.status === 403;
  const permissions = permissionsData?.data ?? [];

  const filtered = permissions.filter((p) => {
    const matchesSearch = search
      ? p.label.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesFilter =
      filter === 'all' ||
      (filter === 'selected' && selectedIds.includes(p.id)) ||
      (filter === 'unselected' && !selectedIds.includes(p.id));
    return matchesSearch && matchesFilter;
  });

  const filters: { key: FilterMode; label: string }[] = [
    { key: 'all', label: t('roles.filterAll') },
    { key: 'selected', label: `${t('roles.filterSelected')} (${selectedIds.length})` },
    { key: 'unselected', label: `${t('roles.filterUnselected')} (${permissions.length - selectedIds.length})` },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  if (isForbidden) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border py-8 text-sm text-muted-foreground">
        <ShieldX className="h-8 w-8" />
        <p>{t('roles.permissionsForbidden')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('roles.searchPermissions')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ps-9"
        />
      </div>

      <div className="max-h-[300px] overflow-y-auto rounded-lg border">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{t('common.noData')}</p>
        ) : (
          <div className="divide-y">
            {filtered.map((permission) => (
              <label
                key={permission.id}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-accent"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(permission.id)}
                  onChange={() => onToggle(permission.id)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>{permission.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {selectedIds.length} / {permissions.length} {t('roles.permissionsSelected')}
      </p>
    </div>
  );
}
