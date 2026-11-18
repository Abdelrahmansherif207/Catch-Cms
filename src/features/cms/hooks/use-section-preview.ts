import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Language } from '@/shared/constants/api';
import { queryKeys } from '@/shared/lib/query-keys';
import { fetchSectionPreviewItems } from '../api/sections.api';
import {
  normalizeSectionPreview,
  type SectionPreviewType,
} from '../lib/section-preview-data';

/** The endpoint changes per keystroke; wait for a settled value before fetching. */
export const SECTION_PREVIEW_DEBOUNCE_MS = 500;

/** Cards may be reused for this long when the editor returns to the same params. */
export const SECTION_PREVIEW_STALE_MS = 45_000;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

interface UseSectionPreviewOptions {
  /** Effective preview endpoint (already capped with `withPreviewLimit`). */
  endpoint: string;
  type: SectionPreviewType;
  language: Language;
  enabled: boolean;
}

/**
 * Live result preview for a section endpoint.
 *
 * React Query owns the AbortController: when the debounced endpoint changes
 * (or the editor unmounts), the previous query's signal aborts and axios
 * cancels the request. Results are cached per endpoint + dashboard language,
 * so retyping a value within the stale window is instant.
 */
export function useSectionPreview({
  endpoint,
  type,
  language,
  enabled,
}: UseSectionPreviewOptions) {
  const debouncedEndpoint = useDebouncedValue(
    endpoint,
    SECTION_PREVIEW_DEBOUNCE_MS
  );

  const query = useQuery({
    queryKey: queryKeys.sections.previewItems(debouncedEndpoint, language),
    queryFn: ({ signal }) => fetchSectionPreviewItems(debouncedEndpoint, signal),
    enabled: enabled && Boolean(debouncedEndpoint),
    staleTime: SECTION_PREVIEW_STALE_MS,
    gcTime: 5 * 60_000,
    // The preview is advisory: show the retry affordance instead of retrying
    // silently and blocking the error state.
    retry: false,
    refetchOnWindowFocus: false,
  });

  const normalized = useMemo(
    () =>
      query.data === undefined
        ? null
        : normalizeSectionPreview(query.data, type, language),
    [query.data, type, language]
  );

  return {
    items: normalized?.items ?? [],
    total: normalized?.total ?? null,
    receivedCount: normalized?.receivedCount ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
    /** True while the endpoint is still waiting for the debounce window. */
    isDebouncing: endpoint !== debouncedEndpoint,
  };
}
