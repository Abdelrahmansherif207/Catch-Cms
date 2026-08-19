import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import type { InvoiceStatus } from '../types/invoice.types';
import { invoiceStatusStyles, humanizeStatus } from '../lib/invoice-utils';

interface InvoiceStatusBadgeProps {
  status: string;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const { t } = useTranslation();
  const normalized = status.replace(/-/g, '_') as InvoiceStatus;
  const styles = invoiceStatusStyles[normalized] || invoiceStatusStyles.pending;
  const label = t(`invoices.status.${normalized}`, { defaultValue: humanizeStatus(status) });

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        styles
      )}
    >
      {label}
    </span>
  );
}