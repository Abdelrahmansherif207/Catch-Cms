import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, Upload } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { cn } from '@/shared/lib/utils';
import { useLanguage } from '@/shared/hooks/use-language';
import {
  userFormSchema,
  userFormDefaults,
  toApiFormat,
  getPasswordStrength,
  type UserFormValues,
} from '../schemas/user.schema';
import { useCreateUser, useRoles } from '../hooks/use-users';
import type { ApiErrorResponse } from '@/shared/api';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: UserFormDialogProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const createMutation = useCreateUser();
  const { data: rolesData, isLoading: isRolesLoading } = useRoles();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [rolesOpen, setRolesOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema) as any,
    defaultValues: userFormDefaults,
  });

  const selectedRoleIds = form.watch('roleIds') || [];
  const password = form.watch('password') || '';

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setServerErrors({});
      setImagePreview(null);
      form.reset(userFormDefaults);
    }
    prevOpenRef.current = open;
  }, [open, form]);

  useEffect(() => {
    if (createMutation.isSuccess) {
      setServerErrors({});
      setImagePreview(null);
      form.reset(userFormDefaults);
    }
  }, [createMutation.isSuccess, form]);

  const toggleRole = (roleId: number) => {
    const current = form.getValues('roleIds') || [];
    const updated = current.includes(roleId)
      ? current.filter((id) => id !== roleId)
      : [...current, roleId];
    form.setValue('roleIds', updated, { shouldValidate: true });
  };

  const parseDisplayName = (displayName: string): string => {
    try {
      const parsed = JSON.parse(displayName);
      return parsed[language] || parsed.en || displayName;
    } catch {
      return displayName;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('image', file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const roles = rolesData?.data || [];

  const onSubmit = (values: UserFormValues) => {
    setServerErrors({});
    const apiData = toApiFormat(values);

    createMutation.mutate(apiData, {
      onSuccess: () => {
        onSuccess();
      },
      onError: (error: unknown) => {
        const apiError = error as ApiErrorResponse;
        if (apiError?.status === 422 && apiError.errors) {
          setServerErrors(apiError.errors);
        }
      },
    });
  };

  const isPending = createMutation.isPending;
  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof typeof errors]?.message as string | undefined;
    const serverErr = serverErrors[field]?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('users.createUser')}</DialogTitle>
          <DialogDescription>
            {t('users.createUserSubtitle')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4" noValidate>
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="size-20">
                <AvatarImage src={imagePreview || undefined} alt="Avatar preview" />
                <AvatarFallback className="bg-muted text-muted-foreground text-lg">
                  <Upload className="size-6" />
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full opacity-0 hover:bg-black/40 hover:opacity-100 transition-opacity"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">{t('usersForm.name')} *</label>
            <Input
              id="name"
              placeholder={t('usersForm.name')}
              {...form.register('name')}
            />
            {getError('name') && (
              <p className="text-xs text-destructive">{getError('name')}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">{t('usersForm.email')} *</label>
            <Input
              id="email"
              type="email"
              placeholder={t('usersForm.email')}
              {...form.register('email')}
            />
            {getError('email') && (
              <p className="text-xs text-destructive">{getError('email')}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">{t('usersForm.password')} *</label>
            <Input
              id="password"
              type="password"
              placeholder={t('usersForm.password')}
              {...form.register('password')}
            />
            {password && (
              <div className="mt-1 space-y-1">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={'h-full rounded-full transition-all ' + passwordStrength.color}
                    style={{ width: passwordStrength.percent + '%' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{passwordStrength.label}</p>
              </div>
            )}
            {getError('password') && (
              <p className="text-xs text-destructive">{getError('password')}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="passwordConfirmation" className="text-sm font-medium">{t('usersForm.passwordConfirmation')} *</label>
            <Input
              id="passwordConfirmation"
              type="password"
              placeholder={t('usersForm.passwordConfirmation')}
              {...form.register('passwordConfirmation')}
            />
            {getError('passwordConfirmation') && (
              <p className="text-xs text-destructive">{getError('passwordConfirmation')}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phoneNumber" className="text-sm font-medium">{t('usersForm.phoneNumber')} *</label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder={t('usersForm.phoneNumber')}
              {...form.register('phoneNumber')}
            />
            {getError('phoneNumber') && (
              <p className="text-xs text-destructive">{getError('phoneNumber')}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('usersForm.roles')} *</label>
            <div className="relative">
              <button
                type="button"
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                onClick={() => setRolesOpen(!rolesOpen)}
              >
                <span className={selectedRoleIds.length === 0 ? 'text-muted-foreground' : ''}>
                  {selectedRoleIds.length === 0
                    ? t('usersForm.selectRoles')
                    : selectedRoleIds.length + ' ' + t('usersForm.rolesSelected')}
                </span>
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </button>
              {rolesOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                  <div className="max-h-[200px] overflow-auto">
                    {isRolesLoading && (
                      <p className="px-2 py-1 text-xs text-muted-foreground">{t('common.loading')}</p>
                    )}
                    {!isRolesLoading && roles.length === 0 && (
                      <p className="px-2 py-1 text-xs text-muted-foreground">{t('common.noData')}</p>
                    )}
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent"
                        onClick={() => toggleRole(role.id)}
                      >
                        <div className={cn(
                          'flex h-4 w-4 items-center justify-center rounded-sm border',
                          selectedRoleIds.includes(role.id) ? 'bg-primary border-primary' : 'border-input'
                        )}>
                          {selectedRoleIds.includes(role.id) && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <span className="text-sm">{parseDisplayName(role.display_name)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {getError('roleIds') && (
              <p className="text-xs text-destructive">{getError('roleIds')}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('usersForm.isActive')} *</label>
            <Select
              value={form.watch('isActive')}
              onValueChange={(value) => value && form.setValue('isActive', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('usersForm.isActive')}>
                  {form.watch('isActive') === '1' ? t('usersForm.active') : t('usersForm.inactive')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('usersForm.active')}</SelectItem>
                <SelectItem value="0">{t('usersForm.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending || isRolesLoading}>
              {isRolesLoading
                ? t('common.loading')
                : isPending
                  ? t('users.creating')
                  : t('usersForm.createUser')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
