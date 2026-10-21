import type { LocationType } from '@/features/locations/types/location.types';

/**
 * Per-type color accents for map nodes. Borders/dots use Tailwind color
 * utilities on top of the semantic bg-card so nodes stay legible in dark
 * mode; the minimap needs concrete hex values.
 */
export interface BinTypeStyle {
  border: string;
  dot: string;
  minimap: string;
}

export const LOCATION_TYPE_STYLES: Record<LocationType, BinTypeStyle> = {
  receiving: { border: 'border-sky-400/70', dot: 'bg-sky-500', minimap: '#0ea5e9' },
  storage: { border: 'border-violet-400/70', dot: 'bg-violet-500', minimap: '#8b5cf6' },
  picking: { border: 'border-emerald-400/70', dot: 'bg-emerald-500', minimap: '#10b981' },
  packing: { border: 'border-amber-400/70', dot: 'bg-amber-500', minimap: '#f59e0b' },
  staging: { border: 'border-cyan-400/70', dot: 'bg-cyan-500', minimap: '#06b6d4' },
  quarantine: { border: 'border-orange-400/70', dot: 'bg-orange-500', minimap: '#f97316' },
  damaged: { border: 'border-red-400/70', dot: 'bg-red-500', minimap: '#ef4444' },
  returns: { border: 'border-fuchsia-400/70', dot: 'bg-fuchsia-500', minimap: '#d946ef' },
};

export const UNTYPED_BIN_STYLE: BinTypeStyle = {
  border: 'border-border',
  dot: 'bg-muted-foreground/40',
  minimap: '#94a3b8',
};

export function binStyleFor(type: LocationType | null): BinTypeStyle {
  return type ? LOCATION_TYPE_STYLES[type] : UNTYPED_BIN_STYLE;
}
