import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Trash2, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { useRole, useDeleteRole } from '../hooks/use-roles';
import { parseDisplayName } from '../schemas/role.schema';
import { roleRoutes } from '../routes/role.routes';
import { RoleDeleteDialog } from '../components/role-delete-dialog';
import { useState } from 'react';
import type { QueryKey } from '@tanstack/react-query';

export function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const roleId = Number(id);
  const { data: response, isLoading, isError } = useRole(roleId);
  const deleteMutation = useDeleteRole();

  const role = response?.data;
  const lang = i18n.language || 'en';

  const handleDelete = () => {
    deleteMutation.mutate(roleId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles', 'list'] as QueryKey });
        navigate(roleRoutes.list);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !role) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <ShieldCheck className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">{t('roles.notFound')}</p>
        <Button variant="outline" onClick={() => navigate(roleRoutes.list)}>
          <ArrowLeft className="me-2 h-4 w-4" />
          {t('roles.backToList')}
        </Button>
      </div>
    );
  }

  const parsed = parseDisplayName(role.display_name);
  const label = lang === 'ar' && parsed.ar ? parsed.ar : parsed.en;
  const permissions = role.permissions ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(roleRoutes.list)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{label}</h1>
            <p className="text-sm text-muted-foreground">{t('roles.roleDetail')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(roleRoutes.list)}>
            <Pencil className="me-2 h-4 w-4" />
            {t('common.edit')}
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="me-2 h-4 w-4" />
            {t('common.delete')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t('roles.roleInfo')}
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('roles.id')}</dt>
              <dd className="font-medium">{role.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('roles.displayName')} (EN)</dt>
              <dd className="font-medium" dir="ltr">{parsed.en}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('roles.displayName')} (AR)</dt>
              <dd className="font-medium" dir="rtl">{parsed.ar}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('roles.guardName')}</dt>
              <dd className="font-medium">api</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t('roles.permissionsCount', { count: permissions.length })}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {permissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('roles.noPermissions')}</p>
            ) : (
              permissions.map((perm) => (
                <Badge key={perm.id} variant="secondary">
                  {perm.label}
                </Badge>
              ))
            )}
          </div>
        </div>
      </div>

      <RoleDeleteDialog
        roleId={roleId}
        roleName={parsed.en}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={handleDelete}
      />
    </div>
  );
}
