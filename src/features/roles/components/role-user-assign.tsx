import { useState, useEffect, useRef } from 'react';
import { Search, UserRound, Loader2, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { fetchUserById } from '../api/roles.api';
import { useUsers, useAssignUserRoles, useRemoveUserRoles } from '../hooks/use-roles';

interface RoleUserAssignProps {
  roleId: number;
}

export function RoleUserAssign({ roleId }: RoleUserAssignProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [userRolesCache, setUserRolesCache] = useState<Record<number, number[]>>({});
  const [loadingRoles, setLoadingRoles] = useState<Set<number>>(new Set());
  const [processingUsers, setProcessingUsers] = useState<Set<number>>(new Set());

  const { data: usersData, isLoading: isUsersLoading } = useUsers(search);
  const assignMutation = useAssignUserRoles();
  const removeMutation = useRemoveUserRoles();

  const users = usersData?.data?.data ?? [];

  const prevUserIdsRef = useRef<string>('');
  useEffect(() => {
    const ids = users.map((u) => u.id).join(',');
    if (!ids || ids === prevUserIdsRef.current) return;
    prevUserIdsRef.current = ids;

    setLoadingRoles(new Set(users.map((u) => u.id)));

    Promise.allSettled(
      users.map(async (user) => {
        const response = await fetchUserById(user.id);
        const roleIds = response.data?.roles?.map((r) => r.id) || [];
        return { userId: user.id, roleIds };
      })
    ).then((results) => {
      const newCache: Record<number, number[]> = {};
      for (const result of results) {
        if (result.status === 'fulfilled') {
          newCache[result.value.userId] = result.value.roleIds;
        }
      }
      setUserRolesCache((prev) => ({ ...prev, ...newCache }));
      setLoadingRoles(new Set());
    });
  }, [users]);

  const getUserRoles = async (userId: number): Promise<number[]> => {
    if (userRolesCache[userId]) return userRolesCache[userId];
    const response = await fetchUserById(userId);
    const roleIds = response.data?.roles?.map((r) => r.id) || [];
    setUserRolesCache((prev) => ({ ...prev, [userId]: roleIds }));
    return roleIds;
  };

  const hasRole = (roleIds: number[]) => roleIds.includes(roleId);

  const handleToggle = async (userId: number) => {
    if (processingUsers.has(userId)) return;
    setProcessingUsers((prev) => new Set(prev).add(userId));

    try {
      const currentRoleIds = await getUserRoles(userId);

      const currentlyHasRole = hasRole(currentRoleIds);

      if (currentlyHasRole) {
        await removeMutation.mutateAsync({ userId, roleIds: [roleId] });
        setUserRolesCache((prev) => ({
          ...prev,
          [userId]: prev[userId].filter((id) => id !== roleId),
        }));
      } else {
        const newRoleIds = [...currentRoleIds, roleId];
        await assignMutation.mutateAsync({ userId, roleIds: newRoleIds });
        setUserRolesCache((prev) => ({
          ...prev,
          [userId]: newRoleIds,
        }));
      }
    } finally {
      setProcessingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('roles.searchUsers')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ps-9"
        />
      </div>

      <div className="max-h-[300px] overflow-y-auto rounded-lg border">
        {isUsersLoading && users.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isUsersLoading && users.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">{t('common.noData')}</p>
        )}

        {users.map((user) => {
          const currentRoleIds = userRolesCache[user.id];
          const isLoadingRole = loadingRoles.has(user.id);
          const isKnown = currentRoleIds !== undefined && !isLoadingRole;
          const isAssigned = isKnown && hasRole(currentRoleIds);
          const isProcessing = processingUsers.has(user.id);

          return (
            <div
              key={user.id}
              className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-accent"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <Button
                variant={isAssigned ? 'default' : 'outline'}
                size="sm"
                disabled={!isKnown || isProcessing}
                onClick={() => handleToggle(user.id)}
                className="shrink-0"
              >
                {isProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : !isKnown ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isAssigned ? (
                  <>
                    <Check className="me-1 h-3.5 w-3.5" />
                    {t('roles.assigned')}
                  </>
                ) : (
                  <>
                    <X className="me-1 h-3.5 w-3.5" />
                    {t('roles.notAssigned')}
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
