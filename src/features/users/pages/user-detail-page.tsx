import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  BadgeCheck,
  Mail,
  Phone,
  UserRound,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { Skeleton } from '@/shared/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/ui/tabs';
import { useUser } from '../hooks/use-users';
import { UserActivationDialog } from '../components/user-activation-dialog';
import { UserDeleteDialog } from '../components/user-delete-dialog';
import { userRoutes } from '../routes/user.routes';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activationOpen, setActivationOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useUser(Number(id));
  const user = data?.data;

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="rounded-xl border p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <UserRound className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{t('users.notFound')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(userRoutes.list)}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(userRoutes.list)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setActivationOpen(true)}>
            {Boolean(user.is_active) ? t('users.deactivate') : t('users.activate')}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            {t('common.delete')}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={user.image || undefined} alt={user.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
              {initials || <UserRound className="size-6" />}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="size-3.5" />
              {user.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="size-3.5" />
              {user.phone_number}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={Boolean(user.is_active) ? 'default' : 'secondary'}>
                {Boolean(user.is_active) ? t('users.active') : t('users.inactive')}
              </Badge>
              <Badge variant="outline" className="capitalize">{user.type}</Badge>
              {user.email_verified_at ? (
                <Badge variant="outline" className="gap-1">
                  <BadgeCheck className="size-3" />
                  {t('users.emailVerified')}
                </Badge>
              ) : (
                <Badge variant="outline">{t('users.notVerified')}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles">
            <ShieldCheck className="mr-1.5 size-4" />
            {t('users.rolesTab')}
          </TabsTrigger>
          {user.type === 'user' && (
            <TabsTrigger value="addresses">
              {t('users.addressesTab')}
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="roles" className="rounded-xl border bg-card p-6 shadow-sm">
          {user.roles && user.roles.length > 0 ? (
            <div className="space-y-4">
              {user.roles.map((role) => (
                <div key={role.id}>
                  <h3 className="font-medium">{role.display_name}</h3>
                  {role.permissions && role.permissions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {role.permissions.map((perm) => (
                        <Badge key={perm.id} variant="secondary" className="text-xs">
                          {perm.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('users.noRoles')}</p>
          )}
        </TabsContent>
        {user.type === 'user' && (
          <TabsContent value="addresses" className="rounded-xl border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">{t('users.noAddresses')}</p>
          </TabsContent>
        )}
      </Tabs>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="size-3.5" />
          {t('users.createdAt')}: {user.email_verified_at ? new Date(user.email_verified_at).toLocaleString() : '—'}
        </span>
      </div>

      <UserActivationDialog
        userId={user.id}
        userName={user.name}
        currentStatus={user.is_active}
        open={activationOpen}
        onOpenChange={setActivationOpen}
        onActivated={() => { setActivationOpen(false); refetch(); }}
      />

      <UserDeleteDialog
        userId={user.id}
        userName={user.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => { setDeleteOpen(false); navigate(userRoutes.list); }}
      />
    </div>
  );
}
