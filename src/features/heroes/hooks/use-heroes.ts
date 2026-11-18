import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchHeroes,
  fetchHeroById,
  createHero,
  updateHero,
  toggleHeroActive,
  deleteHero,
} from '../api/heroes.api';
import type {
  CreateHeroData,
  UpdateHeroData,
  Hero,
  FetchHeroesParams,
} from '../types/hero.types';
import type { ApiErrorResponse } from '@/shared/api';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

export function useHeroes(params: FetchHeroesParams = {}) {
  return useQuery({
    queryKey: queryKeys.heroes.list(params),
    queryFn: () => fetchHeroes(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useHero(id: number) {
  return useQuery({
    queryKey: queryKeys.heroes.detail(id),
    queryFn: () => fetchHeroById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateHero() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHeroData) => createHero(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Hero created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.heroes.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to create hero');
    },
  });
}

export function useUpdateHero() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateHeroData }) => updateHero(id, data),
    onSuccess: (response, { id }) => {
      toast.success(response.message || 'Hero updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.heroes.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.heroes.detail(id) });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update hero');
    },
  });
}

export function useToggleHeroActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => toggleHeroActive(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Hero status updated');
      // Toggling deactivates every other hero — refetch both lists.
      queryClient.invalidateQueries({ queryKey: queryKeys.heroes.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.heroes.details() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update hero status');
    },
  });
}

export function useDeleteHero() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteHero(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Hero deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.heroes.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete hero');
    },
  });
}

/** Localized description as an object, falling back to the string form. */
export function heroDescriptionOf(hero: Hero): Record<string, string> {
  if (hero.description_translations && typeof hero.description_translations === 'object') {
    return hero.description_translations;
  }
  try {
    return typeof hero.description === 'string'
      ? JSON.parse(hero.description)
      : hero.description;
  } catch {
    return { en: hero.description, ar: hero.description };
  }
}
