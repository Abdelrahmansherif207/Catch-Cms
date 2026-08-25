import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { useTranslation } from 'react-i18next';
import { Loader2, MapPin, Search } from 'lucide-react';
import { Input } from '@/shared/ui/input';

const DEFAULT_CENTER: [number, number] = [30.0444, 31.2357];
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const SEARCH_DEBOUNCE_MS = 500;
const SEARCH_MIN_CHARS = 3;
const SEARCH_MIN_INTERVAL_MS = 1000;

interface GeocodeResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const pinIcon = L.icon({
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface ClickHandlerProps {
  onPick: (lat: number, lng: number) => void;
}

function ClickHandler({ onPick }: ClickHandlerProps) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface RecenterProps {
  position: [number, number] | null;
}

function Recenter({ position }: RecenterProps) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, Math.max(map.getZoom(), 13));
    }
  }, [position, map]);
  return null;
}

interface PickupLocationMapPickerProps {
  latitude?: string;
  longitude?: string;
  onChange: (latitude: string, longitude: string) => void;
}

export function PickupLocationMapPicker({ latitude, longitude, onChange }: PickupLocationMapPickerProps) {
  const { t, i18n } = useTranslation();

  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasPin = latitude !== '' && longitude !== '' && !Number.isNaN(lat) && !Number.isNaN(lng);
  const position: [number, number] | null = hasPin ? [lat, lng] : null;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const lastRequestAtRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length < SEARCH_MIN_CHARS) return;

    const controller = new AbortController();
    const elapsed = Date.now() - lastRequestAtRef.current;
    const wait = Math.max(0, SEARCH_MIN_INTERVAL_MS - elapsed);

    const runSearch = async () => {
      setIsSearching(true);
      setSearchError(false);
      lastRequestAtRef.current = Date.now();
      try {
        const params = new URLSearchParams({
          format: 'jsonv2',
          limit: '5',
          q: debouncedQuery,
          'accept-language': i18n.language === 'ar' ? 'ar' : 'en',
        });
        const response = await fetch(`${NOMINATIM_SEARCH_URL}?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(String(response.status));
        const data: GeocodeResult[] = await response.json();
        setResults(data);
        setShowResults(true);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setSearchError(true);
        }
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(runSearch, wait);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.trim().length < SEARCH_MIN_CHARS) {
      setResults([]);
      setSearchError(false);
      setShowResults(false);
    }
  };

  const selectResult = (result: GeocodeResult) => {
    const resultLat = Number(result.lat);
    const resultLng = Number(result.lon);
    if (!Number.isNaN(resultLat) && !Number.isNaN(resultLng)) {
      onChange(resultLat.toFixed(6), resultLng.toFixed(6));
    }
    setShowResults(false);
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <div className="relative">
        <Search className="absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={t('pickupLocations.searchLocation')}
          className="h-9 ps-8 pe-8"
        />
        {isSearching && (
          <Loader2 className="absolute end-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {showResults && !isSearching && (
          <div className="absolute z-[1000] top-full mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden">
            {searchError ? (
              <p className="px-3 py-2 text-xs text-destructive">{t('pickupLocations.searchFailed')}</p>
            ) : results.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">{t('common.noData')}</p>
            ) : (
              results.map((result) => (
                <button
                  key={result.place_id}
                  type="button"
                  onClick={() => selectResult(result)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-start text-sm hover:bg-accent"
                >
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-2 text-xs leading-relaxed">{result.display_name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{t('pickupLocations.mapHint')}</p>
      <div className="h-72 overflow-hidden rounded-md border">
        <MapContainer
          center={position ?? DEFAULT_CENTER}
          zoom={position ? 14 : 11}
          className="h-full w-full"
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={(la, ln) => onChange(la.toFixed(6), ln.toFixed(6))} />
          <Recenter position={position} />
          {position && (
            <Marker
              position={position}
              icon={pinIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const { lat: la, lng: ln } = (e.target as L.Marker).getLatLng();
                  onChange(la.toFixed(6), ln.toFixed(6));
                },
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
