import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import type { InvoiceStatus } from '../types/invoice.types';
import { invoiceStatusStyles, humanizeStatus } from '../lib/invoice-utils';

interface InvoiceStatusBadgeProps {
  status: string;
  className?: string;
}

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const { t } = useTranslation();
  const normalized = status.replace(/-/g, '_') as InvoiceStatus;
  const styles = invoiceStatusStyles[normalized] || invoiceStatusStyles.pending;
  const label = t(`invoices.status.${normalized}`, { defaultValue: humanizeStatus(status) });

  return (
    <Badge variant="outline" className={cn('font-normal', styles, className)}>
      {label}
    </Badge>
  );
}