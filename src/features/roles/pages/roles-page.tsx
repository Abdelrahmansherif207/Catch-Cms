import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/components/page-header';
import { SearchInput } from '@/shared/components/search-input';
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

  // GET /roles returns a Laravel paginator: { data: { data: Role[], ... } }.
  // Accept a plain array too so a backend shape change can't white-screen the page.
  const rawRoles = data?.data;
  const roles = Array.isArray(rawRoles) ? rawRoles : (rawRoles?.data ?? []);

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

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('roles.title')}
        description={t('roles.subtitle')}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="me-2 h-4 w-4" />
            {t('roles.addRole')}
          </Button>
        }
      />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={t('roles.searchPlaceholder')}
      />

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
