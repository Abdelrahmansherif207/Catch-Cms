import type { InvoiceAddress } from '../types/invoice.types';

export function InvoiceAddressView({ address }: { address?: InvoiceAddress | null }) {
  if (!address) {
    return <span className="text-muted-foreground">—</span>;
  }

  const lines = [
    address.line1 || address.street || address.street_address,
    address.line2,
    [address.city, address.state].filter(Boolean).join(', '),
    address.country,
    address.postal_code,
  ].filter(Boolean);

  if (lines.length === 0 && !address.name && !address.phone) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="space-y-0.5 text-sm">
      {address.name && <p className="font-medium">{address.name}</p>}
      {lines.map((line, i) => (
        <p key={i}>{line}</p>
      ))}
      {address.phone && (
        <p dir="ltr" className="text-muted-foreground">
          {address.phone}
        </p>
      )}
    </div>
  );
}