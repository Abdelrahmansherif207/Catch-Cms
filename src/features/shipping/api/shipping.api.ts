import { axiosClient } from '@/shared/api';
import type {
  ApiPaginatedResponse,
  ApiListResponse,
  ApiDetailResponse,
  ApiSingleResponse,
  Country,
  Governorate,
  City,
  CreateCountryData,
  UpdateCountryData,
  CreateGovernorateData,
  UpdateGovernorateData,
  CreateCityData,
  UpdateCityData,
  BulkStatusData,
  FastShippingData,
} from '../types/shipping.types';

export interface FetchCountriesParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
}

export async function fetchCountries({
  page = 1,
  perPage = 15,
  search,
  status,
}: FetchCountriesParams = {}): Promise<ApiPaginatedResponse<Country>> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', perPage.toString());
  if (search) params.append('search', search);
  if (status !== undefined) params.append('status', status);
  const { data } = await axiosClient.get<ApiPaginatedResponse<Country>>('/countries?' + params.toString());
  return data;
}

export async function fetchCountriesAll(): Promise<ApiListResponse<Country>> {
  const { data } = await axiosClient.get<ApiListResponse<Country>>('/countries');
  return data;
}

export async function fetchCountryById(id: number): Promise<ApiDetailResponse<Country>> {
  const { data } = await axiosClient.get<ApiDetailResponse<Country>>('/countries/' + id);
  return data;
}

export async function createCountry(payload: CreateCountryData): Promise<ApiSingleResponse<Country>> {
  const { data } = await axiosClient.post<ApiSingleResponse<Country>>('/countries', payload);
  return data;
}

export async function updateCountry(id: number, payload: UpdateCountryData): Promise<ApiSingleResponse<Country>> {
  const { data } = await axiosClient.put<ApiSingleResponse<Country>>('/countries/' + id, payload);
  return data;
}

export async function deleteCountry(id: number): Promise<ApiSingleResponse<null>> {
  const { data } = await axiosClient.delete<ApiSingleResponse<null>>('/countries/' + id);
  return data;
}

export async function countriesChangeStatus(payload: BulkStatusData): Promise<ApiSingleResponse<null>> {
  const { data } = await axiosClient.post<ApiSingleResponse<null>>('/countries/change-status', payload);
  return data;
}

export async function fetchCountryGovernorates(countryId: number): Promise<ApiDetailResponse<Country>> {
  const { data } = await axiosClient.get<ApiDetailResponse<Country>>('/countries/' + countryId + '/governorates');
  return data;
}

export interface FetchGovernoratesParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  country_id?: number;
}

export async function fetchGovernorates({
  page = 1,
  perPage = 15,
  search,
  status,
  country_id,
}: FetchGovernoratesParams = {}): Promise<ApiPaginatedResponse<Governorate>> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', perPage.toString());
  if (search) params.append('search', search);
  if (status !== undefined) params.append('status', status);
  if (country_id) params.append('country_id', country_id.toString());
  const { data } = await axiosClient.get<ApiPaginatedResponse<Governorate>>('/governorates?' + params.toString());
  return data;
}

export async function fetchGovernorateById(id: number): Promise<ApiDetailResponse<Governorate>> {
  const { data } = await axiosClient.get<ApiDetailResponse<Governorate>>('/governorates/' + id);
  return data;
}

export async function createGovernorate(payload: CreateGovernorateData): Promise<ApiSingleResponse<Governorate>> {
  const { data } = await axiosClient.post<ApiSingleResponse<Governorate>>('/governorates', payload);
  return data;
}

export async function updateGovernorate(id: number, payload: UpdateGovernorateData): Promise<ApiSingleResponse<Governorate>> {
  const { data } = await axiosClient.put<ApiSingleResponse<Governorate>>('/governorates/' + id, payload);
  return data;
}

export async function deleteGovernorate(id: number): Promise<ApiSingleResponse<null>> {
  const { data } = await axiosClient.delete<ApiSingleResponse<null>>('/governorates/' + id);
  return data;
}

export async function governoratesChangeStatus(payload: BulkStatusData): Promise<ApiSingleResponse<null>> {
  const { data } = await axiosClient.put<ApiSingleResponse<null>>('/governorates/change-status', payload);
  return data;
}

export async function governorateFastShipping(id: number, payload: FastShippingData): Promise<ApiSingleResponse<Governorate>> {
  const { data } = await axiosClient.put<ApiSingleResponse<Governorate>>('/governorates/' + id + '/fast-shipping', payload);
  return data;
}

export async function fetchGovernorateCities(governorateId: number): Promise<ApiDetailResponse<Governorate>> {
  const { data } = await axiosClient.get<ApiDetailResponse<Governorate>>('/governorates/' + governorateId + '/cities');
  return data;
}

export interface FetchCitiesParams {
  page?: number;
  perPage?: number;
  search?: string;
  governorate_id?: number;
}

export async function fetchCities({
  page = 1,
  perPage = 15,
  search,
  governorate_id,
}: FetchCitiesParams = {}): Promise<ApiPaginatedResponse<City>> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', perPage.toString());
  if (search) params.append('search', search);
  if (governorate_id) params.append('governorate_id', governorate_id.toString());
  const { data } = await axiosClient.get<ApiPaginatedResponse<City>>('/cities?' + params.toString());
  return data;
}

export async function fetchCityById(id: number): Promise<ApiDetailResponse<City>> {
  const { data } = await axiosClient.get<ApiDetailResponse<City>>('/cities/' + id);
  return data;
}

export async function createCity(payload: CreateCityData): Promise<ApiSingleResponse<City>> {
  const { data } = await axiosClient.post<ApiSingleResponse<City>>('/cities', payload);
  return data;
}

export async function updateCity(id: number, payload: UpdateCityData): Promise<ApiSingleResponse<City>> {
  const { data } = await axiosClient.put<ApiSingleResponse<City>>('/cities/' + id, payload);
  return data;
}

export async function deleteCity(id: number): Promise<ApiSingleResponse<null>> {
  const { data } = await axiosClient.delete<ApiSingleResponse<null>>('/cities/' + id);
  return data;
}
