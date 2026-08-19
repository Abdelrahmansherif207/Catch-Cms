import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { queryKeys } from '@/shared/lib/query-keys';
import type { ApiErrorResponse } from '@/shared/api';
import {
  fetchCurrencies,
  fetchCurrencyById,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  setBaseCurrency as apiSetBaseCurrency,
  setCatalogCurrency as apiSetCatalogCurrency,
  fetchExchangeRates as apiFetchExchangeRates,
  createExchangeRate,
  updateExchangeRate,
  deleteExchangeRate as apiDeleteExchangeRate,
  type FetchCurrenciesParams,
  type FetchExchangeRatesParams,
} from '../api/currencies.api';

// Re-export for consumers
export type { FetchCurrenciesParams, FetchExchangeRatesParams };

// Error handler
function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message =
    apiError?.message ||
    (apiError?.errors ? Object.values(apiError.errors).flat().join(', ') : '') ||
    fallbackMessage;
  toast.error(message);
  return apiError;
}

// ─── Currency Query Hooks ────────────────────────────────────────────────────

export function useCurrencies(params: FetchCurrenciesParams = {}) {
  return useQuery({
    queryKey: queryKeys.currencies.list(params),
    queryFn: () => fetchCurrencies(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCurrency(id: number) {
  return useQuery({
    queryKey: queryKeys.currencies.detail(id),
    queryFn: () => fetchCurrencyById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Currency Mutation Hooks ─────────────────────────────────────────────────

interface MutationCallbacks<TData = unknown> {
  onSuccess?: (data: TData) => void;
  onError?: (error: unknown) => void;
}

export function useCreateCurrency(callbacks?: MutationCallbacks) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCurrency,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.lists() });
      callbacks?.onSuccess?.(response);
    },
    onError: (error: unknown) => {
      if (callbacks?.onError) {
        callbacks.onError(error);
      } else {
        handleApiError(error, t('currencies.createError'));
      }
    },
  });
}

export function useUpdateCurrency(callbacks?: MutationCallbacks) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateCurrency>[1] }) =>
      updateCurrency(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.detail(id) });
      callbacks?.onSuccess?.(response);
    },
    onError: (error: unknown) => {
      if (callbacks?.onError) {
        callbacks.onError(error);
      } else {
        handleApiError(error, t('currencies.updateError'));
      }
    },
  });
}

export function useDeleteCurrency() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCurrency(id),
    onSuccess: (response) => {
      toast.success(response.message || t('currencies.deleted'));
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, t('currencies.deleteError'));
    },
  });
}

export function useSetBaseCurrency() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiSetBaseCurrency(id),
    onSuccess: (response) => {
      toast.success(response.message || t('currencies.baseUpdated'));
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, t('currencies.setBaseError'));
    },
  });
}

export function useSetCatalogCurrency() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiSetCatalogCurrency(id),
    onSuccess: (response) => {
      toast.success(response.message || t('currencies.catalogUpdated'));
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, t('currencies.setCatalogError'));
    },
  });
}

// ─── Exchange Rate Hooks ─────────────────────────────────────────────────────

export function useExchangeRates(params: FetchExchangeRatesParams) {
  return useQuery({
    queryKey: queryKeys.currencyRates.list(params),
    queryFn: () => apiFetchExchangeRates(params),
    enabled: !!(params.currency_id || params.code),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateExchangeRate() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExchangeRate,
    onSuccess: (response) => {
      toast.success(response.message || t('currencyRates.created'));
      queryClient.invalidateQueries({ queryKey: queryKeys.currencyRates.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, t('currencyRates.createError'));
    },
  });
}

export function useUpdateExchangeRate() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { effective_date: string; exchange_rate: number } }) =>
      updateExchangeRate(id, data),
    onSuccess: (response) => {
      toast.success(response.message || t('currencyRates.updated'));
      queryClient.invalidateQueries({ queryKey: queryKeys.currencyRates.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, t('currencyRates.updateError'));
    },
  });
}

export function useDeleteExchangeRate() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDeleteExchangeRate(id),
    onSuccess: (response) => {
      toast.success(response.message || t('currencyRates.deleted'));
      queryClient.invalidateQueries({ queryKey: queryKeys.currencyRates.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, t('currencyRates.deleteError'));
    },
  });
}
