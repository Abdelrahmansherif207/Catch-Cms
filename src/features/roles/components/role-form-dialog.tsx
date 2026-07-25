import { useEffect, useRef, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  roleFormSchema,
  roleFormDefaults,
  toApiFormat,
  parseDisplayName,
  autoGenerateName,
  type RoleFormValues,
} from '../schemas/role.schema';
import {
  useCreateRole,
  useUpdateRole,
  useRole,
  useAssignPermissions,
} from '../hooks/use-roles';
import { RolePermissionsGrid } from './role-permissions-grid';
import { RoleUserAssign } from './role-user-assign';
import type { Role } from '../types/role.types';
import type { ApiErrorResponse } from '@/shared/api';

interface RoleFormDialogProps {
  role?: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RoleFormDialog({
  role,
  open,
  onOpenChange,
  onSuccess,
}: RoleFormDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!role;
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const assignPermissionsMutation = useAssignPermissions();
  const { data: roleDetail, isLoading: isDetailLoading } = useRole(role?.id ?? 0);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [createdRole, setCreatedRole] = useState<{ id: number } | null>(null);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema) as any,
    defaultValues: roleFormDefaults,
  });

  const permissionIds = form.watch('permissionIds');
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const activeRoleId = isEditing && role ? role.id : createdRole?.id;
  const showUsers = !!activeRoleId;
  const isPostCreate = !!createdRole;

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setServerErrors({});
      setCreatedRole(null);
      form.reset(roleFormDefaults);
    }
    prevOpenRef.current = open;
  }, [open, form]);

  useEffect(() => {
    if (isEditing && role && roleDetail?.data) {
      const d = roleDetail.data;
      const parsed = parseDisplayName(d.display_name);
      form.setValue('displayNameEn', parsed.en);
      form.setValue('displayNameAr', parsed.ar);
      form.setValue('permissionIds', d.permissions.map((p) => p.id));
    }
  }, [roleDetail, isEditing, role, form]);

  const handleTogglePermission = (permissionId: number) => {
    const current = form.getValues('permissionIds') || [];
    const updated = current.includes(permissionId)
      ? current.filter((id) => id !== permissionId)
      : [...current, permissionId];
    form.setValue('permissionIds', updated, { shouldValidate: true });
  };

  const handleNameEnChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    form.setValue('displayNameEn', val);
    form.setValue('name', autoGenerateName(val));
  }, [form]);

  const handleClose = () => {
    onOpenChange(false);
    if (createdRole) {
      onSuccessRef.current();
    }
  };

  const onSubmit = async (values: RoleFormValues) => {
    setServerErrors({});
    const apiData = toApiFormat(values);

    const handleError = (error: unknown) => {
      const apiError = error as ApiErrorResponse;
      if (apiError?.status === 422 && apiError.errors) {
        setServerErrors(apiError.errors);
      }
    };

    try {
      if (isEditing && role) {
        await updateMutation.mutateAsync(
          { id: role.id, data: { ...apiData, _method: 'PUT' } }
        );
        if (values.permissionIds.length > 0) {
          await assignPermissionsMutation.mutateAsync(
            { roleId: role.id, permissionIds: values.permissionIds }
          );
        }
        onSuccessRef.current();
      } else {
        const response = await createMutation.mutateAsync(apiData);
        const newId = response.data?.id;
        if (newId && values.permissionIds.length > 0) {
          await assignPermissionsMutation.mutateAsync(
            { roleId: newId, permissionIds: values.permissionIds }
          );
        }
        setCreatedRole({ id: newId! });
      }
    } catch (error) {
      handleError(error);
    }
  };

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    assignPermissionsMutation.isPending ||
    isDetailLoading;

  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof RoleFormValues]?.message as string | undefined;
    const serverErr = serverErrors[field]?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  const dialogTitle = isPostCreate
    ? t('roles.editRole')
    : isEditing
      ? t('roles.editRole')
      : t('roles.createRole');

  const dialogDesc = isPostCreate
    ? t('roles.editSubtitle')
    : isEditing
      ? t('roles.editSubtitle')
      : t('roles.createSubtitle');

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDesc}</DialogDescription>
        </DialogHeader>

        {isDetailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="displayNameEn" className="text-sm font-medium">
                {t('rolesForm.nameEn')} *
              </label>
              <Input
                id="displayNameEn"
                placeholder={t('rolesForm.nameEn')}
                value={form.watch('displayNameEn')}
                onChange={handleNameEnChange}
              />
              {getError('displayNameEn') && (
                <p className="text-xs text-destructive">{getError('displayNameEn')}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="displayNameAr" className="text-sm font-medium">
                {t('rolesForm.nameAr')} *
              </label>
              <Input
                id="displayNameAr"
                placeholder={t('rolesForm.nameAr')}
                dir="rtl"
                {...form.register('displayNameAr')}
              />
              {getError('displayNameAr') && (
                <p className="text-xs text-destructive">{getError('displayNameAr')}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                {t('roles.name')}
              </label>
              <Input
                id="name"
                placeholder={t('roles.name')}
                {...form.register('name')}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t('roles.guardName')}
              </label>
              <Input
                value="api"
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('rolesForm.permissions')}</label>
            <RolePermissionsGrid
              selectedIds={permissionIds || []}
              onToggle={handleTogglePermission}
            />
          </div>

          {showUsers && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('rolesForm.users')}</label>
              <RoleUserAssign roleId={activeRoleId!} />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              {isPostCreate ? t('common.close') : t('common.cancel')}
            </Button>
            {!isPostCreate && (
              <Button type="submit" disabled={isPending}>
                {isDetailLoading
                  ? t('common.loading')
                  : isPending
                    ? (isEditing ? t('roles.updating') : t('roles.creating'))
                    : (isEditing ? t('rolesForm.updateRole') : t('rolesForm.createRole'))}
              </Button>
            )}
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
