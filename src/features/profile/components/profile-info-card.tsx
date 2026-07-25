import { useTranslation } from 'react-i18next';
import { BadgeCheck, Mail, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import type { ProfileData } from '../types/profile.types';

interface ProfileInfoCardProps {
  profile: ProfileData;
}

export function ProfileInfoCard({ profile }: ProfileInfoCardProps) {
  const { t } = useTranslation();

  const initials = profile.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarImage src={profile.image || undefined} alt={profile.name} />
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
            {initials || <UserRound className="size-6" />}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold">{profile.name}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-3.5" />
            {profile.email}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={profile.is_active ? 'default' : 'secondary'}>
              {profile.is_active ? t('profile.active') : t('profile.inactive')}
            </Badge>
            {profile.email_verified_at ? (
              <Badge variant="outline" className="gap-1">
                <BadgeCheck className="size-3" />
                {t('profile.emailVerified')}
              </Badge>
            ) : (
              <Badge variant="outline">{t('profile.notVerified')}</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
