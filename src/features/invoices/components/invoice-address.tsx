import type {
  InvoiceAddress,
  InvoiceSnapshotAddress,
} from '../types/invoice.types';

type AddressView = Partial<InvoiceSnapshotAddress> &
  Partial<Omit<InvoiceAddress, 'street' | 'city' | 'state' | 'country'>> & {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
  };

export function InvoiceAddressView({
  address,
}: {
  address?: AddressView | null;
}) {
  if (!address) {
    return <span className="text-muted-foreground">—</span>;
  }

  const street = address.line1 || address.street || address.street_address;
  const region = [address.city, address.state ?? address.governorate]
    .filter(Boolean)
    .join(', ');
  const lines = [
    street,
    region,
    [address.zip ?? address.postal_code, address.country].filter(Boolean).join(' '),
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
      {address.coordinates && (
        <p dir="ltr" className="font-mono text-xs text-muted-foreground">
          {address.coordinates}
        </p>
      )}
      {address.phone && (
        <p dir="ltr" className="text-muted-foreground">
          {address.phone}
        </p>
      )}
    </div>
  );
}
