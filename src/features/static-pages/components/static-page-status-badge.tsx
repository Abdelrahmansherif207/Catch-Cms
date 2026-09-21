import { StatusBadge } from '@/shared/components/status-badge';

export function StaticPageStatusBadge({ isActive }: { isActive: boolean }) {
  return <StatusBadge status={isActive} />;
}