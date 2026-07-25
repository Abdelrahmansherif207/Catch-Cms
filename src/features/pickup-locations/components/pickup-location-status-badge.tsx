import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';

interface PickupLocationStatusBadgeProps {
  status: boolean;
}

export function PickupLocationStatusBadge({ status }: PickupLocationStatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <Badge variant={status ? 'default' : 'secondary'}>
      {status ? t('pickupLocations.active') : t('pickupLocations.inactive')}
    </Badge>
  );
}
