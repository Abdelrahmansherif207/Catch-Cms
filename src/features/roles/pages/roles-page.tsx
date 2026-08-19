import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useRoles } from '../hooks/use-roles';
import { RolesTable } from '../components/roles-table';
import { RoleFormDialog } from '../components/role-form-dialog';
import type { Role } from '../types/role.types';

export function RolesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const { data, isLoading, isError, refetch } = useRoles({
    limit: 50,
    search: search || undefined,
  });

  const roles = data?.data ?? [];

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingRole(null);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingRole(null);
    refetch();
  };

  const handleClearSearch = () => {
    setSearch('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('roles.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('roles.subtitle')}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('roles.addRole')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('roles.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            className="ps-9"
          />
        </div>

        {search && (
          <Button variant="ghost" size="sm" onClick={handleClearSearch}>
            {t('common.clear')}
          </Button>
        )}
      </div>

      <RolesTable
        data={roles}
        isLoading={isLoading}
        isError={isError}
        onEdit={handleEdit}
        onRefresh={refetch}
      />

      <RoleFormDialog
        role={editingRole}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
