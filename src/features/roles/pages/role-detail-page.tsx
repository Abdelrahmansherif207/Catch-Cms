import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { PageBackHeader } from '@/shared/components/page-header';
import { DetailHero } from '@/shared/components/detail-hero';
import { CardSection } from '@/shared/components/card-section';
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
      <PageBackHeader
        title={label}
        description={t('roles.roleDetail')}
        backTo={roleRoutes.list}
      />

      <DetailHero
        icon={ShieldCheck}
        title={label}
        subtitle={
          (lang === 'ar' ? parsed.en : parsed.ar) !== label
            ? (lang === 'ar' ? parsed.en : parsed.ar)
            : undefined
        }
        facts={[
          { label: t('roles.id'), value: role.id },
          { label: t('roles.guardName'), value: 'api' },
          {
            label: t('roles.permissionsCount', { count: permissions.length }),
            value: permissions.length,
          },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(roleRoutes.list)}>
              <Pencil className="me-2 h-4 w-4" />
              {t('common.edit')}
            </Button>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="me-2 h-4 w-4" />
              {t('common.delete')}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <CardSection title={t('roles.roleInfo')}>
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
        </CardSection>

        <CardSection title={t('roles.permissionsCount', { count: permissions.length })}>
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
        </CardSection>
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
