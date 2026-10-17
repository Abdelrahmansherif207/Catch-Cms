import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, BellRing, Info } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { orderRoutes } from '@/features/orders/routes/order.routes';
import type { TrackingAttentionAlert } from '../types/tracking.types';

const PRIORITY_STYLES: Record<string, { icon: typeof AlertTriangle; className: string }> = {
  high: { icon: AlertTriangle, className: 'border-destructive/40 bg-destructive-soft text-destructive' },
  medium: { icon: AlertTriangle, className: 'border-warning/40 bg-warning-soft text-warning' },
  low: { icon: Info, className: 'border-info/40 bg-info-soft text-info' },
};

/**
 * Dashboard "requires-attention" feed (polled). Alert links arrive as
 * backend admin URLs ("/admin/orders?payment_status=...") — only the query
 * part is reused, rewritten onto the unified CMS orders route.
 */
export function AttentionAlerts({ alerts }: { alerts: TrackingAttentionAlert[] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (alerts.length === 0) return null;

  const openOnOrders = (alert: TrackingAttentionAlert) => {
    const query = alert.link?.split('?')[1];
    navigate(query ? `${orderRoutes.list}?${query}` : orderRoutes.list);
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase">
        <BellRing className="h-4 w-4" />
        {t('tracking.attention.title')}
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {alerts.map((alert, index) => {
          const style = PRIORITY_STYLES[alert.priority] ?? PRIORITY_STYLES.low;
          const Icon = style.icon;
          return (
            <div
              key={`${alert.type}-${index}`}
              className={`flex items-center gap-3 rounded-2xl border p-3 shadow-card ${style.className}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{alert.message}</p>
                {alert.action && (
                  <p className="truncate text-xs opacity-80">{alert.action}</p>
                )}
              </div>
              <span className="rounded-full bg-background px-2.5 py-1 font-mono text-xs">
                {alert.count}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openOnOrders(alert)}
              >
                {t('tracking.attention.view')}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
