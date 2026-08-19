import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchCountries,
  fetchCountriesAll,
  fetchCountryById,
  createCountry,
  updateCountry,
  deleteCountry,
  countriesChangeStatus,
  fetchGovernorates,
  fetchGovernorateById,
  createGovernorate,
  updateGovernorate,
  deleteGovernorate,
  governoratesChangeStatus,
  fetchCities,
  fetchCityById,
  createCity,
  updateCity,
  deleteCity,
  type FetchCountriesParams,
  type FetchGovernoratesParams,
  type FetchCitiesParams,
} from '../api/shipping.api';
import type {
  CreateCountryData,
  UpdateCountryData,
  CreateGovernorateData,
  UpdateGovernorateData,
  CreateCityData,
  UpdateCityData,
  BulkStatusData,
} from '../types/shipping.types';
import type { ApiErrorResponse } from '@/shared/api';

function handleApiError(error: unknown, fallbackMessage: string) {
  const apiError = error as ApiErrorResponse;
  toast.error(apiError?.message || fallbackMessage);
}

export function useCountries(params: FetchCountriesParams = {}) {
  return useQuery({
    queryKey: queryKeys.shipping.countries.list(params),
    queryFn: () => fetchCountries(params),
  });
}

export function useCountriesAll() {
  return useQuery({
    queryKey: queryKeys.shipping.countries.all,
    queryFn: () => fetchCountriesAll(),
  });
}

export function useCountry(id: number) {
  return useQuery({
    queryKey: queryKeys.shipping.countries.detail(id),
    queryFn: () => fetchCountryById(id),
    enabled: !!id,
  });
}

export function useCreateCountry() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateCountryData) => createCountry(data),
    onSuccess: (response) => {
      toast.success(response.message || t('shipping.countryCreated'));
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.countries.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to create country');
    },
  });
}

export function useUpdateCountry() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCountryData }) => updateCountry(id, data),
    onSuccess: (response) => {
      toast.success(response.message || t('shipping.countryUpdated'));
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.countries.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update country');
    },
  });
}

export function useDeleteCountry() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => deleteCountry(id),
    onSuccess: (response) => {
      toast.success(response.message || t('shipping.countryDeleted'));
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.countries.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete country');
    },
  });
}

export function useCountriesChangeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkStatusData) => countriesChangeStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.countries.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update status');
    },
  });
}

export function useGovernorates(params: FetchGovernoratesParams = {}) {
  return useQuery({
    queryKey: queryKeys.shipping.governorates.list(params),
    queryFn: () => fetchGovernorates(params),
  });
}

export function useGovernorate(id: number) {
  return useQuery({
    queryKey: queryKeys.shipping.governorates.detail(id),
    queryFn: () => fetchGovernorateById(id),
    enabled: !!id,
  });
}

export function useCreateGovernorate() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateGovernorateData) => createGovernorate(data),
    onSuccess: (response) => {
      toast.success(response.message || t('shipping.governorateCreated'));
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.governorates.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to create governorate');
    },
  });
}

export function useUpdateGovernorate() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateGovernorateData }) => updateGovernorate(id, data),
    onSuccess: (response) => {
      toast.success(response.message || t('shipping.governorateUpdated'));
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.governorates.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update governorate');
    },
  });
}

export function useDeleteGovernorate() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => deleteGovernorate(id),
    onSuccess: (response) => {
      toast.success(response.message || t('shipping.governorateDeleted'));
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.governorates.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete governorate');
    },
  });
}

export function useGovernoratesChangeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkStatusData) => governoratesChangeStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.governorates.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update status');
    },
  });
}

export function useCities(params: FetchCitiesParams = {}) {
  return useQuery({
    queryKey: queryKeys.shipping.cities.list(params),
    queryFn: () => fetchCities(params),
  });
}

export function useCity(id: number) {
  return useQuery({
    queryKey: queryKeys.shipping.cities.detail(id),
    queryFn: () => fetchCityById(id),
    enabled: !!id,
  });
}

export function useCreateCity() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateCityData) => createCity(data),
    onSuccess: (response) => {
      toast.success(response.message || t('shipping.cityCreated'));
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.cities.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to create city');
    },
  });
}

export function useUpdateCity() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCityData }) => updateCity(id, data),
    onSuccess: (response) => {
      toast.success(response.message || t('shipping.cityUpdated'));
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.cities.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to update city');
    },
  });
}

export function useDeleteCity() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: number) => deleteCity(id),
    onSuccess: (response) => {
      toast.success(response.message || t('shipping.cityDeleted'));
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.cities.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete city');
    },
  });
}
