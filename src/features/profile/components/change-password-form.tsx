import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useChangePassword } from '@/features/auth/hooks/use-auth';
import {
  changePasswordSchema,
  changePasswordDefaults,
  type ChangePasswordFormData,
} from '@/features/auth/schemas/auth.schema';

export function ChangePasswordForm() {
  const { t } = useTranslation();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const changeMutation = useChangePassword();

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: changePasswordDefaults,
  });

  const onSubmit = (values: ChangePasswordFormData) => {
    changeMutation.mutate(values);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <label htmlFor="oldPassword" className="text-sm font-medium">
          {t('auth.currentPassword')}
        </label>
        <div className="relative">
          <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="oldPassword"
            type={showOld ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            {...form.register('oldPassword')}
            className="ps-9"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute end-1 top-1/2 -translate-y-1/2"
            onClick={() => setShowOld(!showOld)}
          >
            {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {form.formState.errors.oldPassword && (
          <p className="text-xs text-destructive">{form.formState.errors.oldPassword.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="newPassword" className="text-sm font-medium">
          {t('auth.newPassword')}
        </label>
        <div className="relative">
          <Shield className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="newPassword"
            type={showNew ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            {...form.register('newPassword')}
            className="ps-9"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute end-1 top-1/2 -translate-y-1/2"
            onClick={() => setShowNew(!showNew)}
          >
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {form.formState.errors.newPassword && (
          <p className="text-xs text-destructive">{form.formState.errors.newPassword.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="newPassword_confirmation" className="text-sm font-medium">
          {t('auth.confirmNewPassword')}
        </label>
        <div className="relative">
          <Shield className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="newPassword_confirmation"
            type={showConfirm ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            {...form.register('newPassword_confirmation')}
            className="ps-9"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute end-1 top-1/2 -translate-y-1/2"
            onClick={() => setShowConfirm(!showConfirm)}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {form.formState.errors.newPassword_confirmation && (
          <p className="text-xs text-destructive">
            {form.formState.errors.newPassword_confirmation.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={changeMutation.isPending}>
        {changeMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('auth.changing')}
          </>
        ) : (
          t('auth.changePassword')
        )}
      </Button>
    </form>
  );
}
