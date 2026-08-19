import { Badge } from '@/shared/ui/badge';

interface AssignmentStatusBadgeProps {
  isExpired: boolean;
  remaining: number;
  expiresAt: string | null;
}

export function AssignmentStatusBadge({ isExpired, remaining, expiresAt }: AssignmentStatusBadgeProps) {
  if (isExpired) {
    return <Badge variant="destructive">Expired</Badge>;
  }

  if (remaining <= 0) {
    return <Badge variant="secondary">Exhausted</Badge>;
  }

  if (expiresAt) {
    const daysUntilExpiry = Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Expiring soon</Badge>;
    }
  }

  return <Badge variant="default" className="bg-green-600">Active</Badge>;
}
