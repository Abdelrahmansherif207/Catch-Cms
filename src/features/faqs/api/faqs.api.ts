import { axiosClient } from '@/shared/api';
import type {
  FaqsListResponse,
  FaqDetailResponse,
  ApiResponse,
  CreateFaqData,
  UpdateFaqData,
  Faq,
} from '../types/faq.types';

export interface FetchFaqsParams {
  page?: number;
  perPage?: number;
  search?: string;
  order?: string;
  sortedBy?: string;
}

export async function fetchFaqs({
  page = 1,
  perPage = 15,
  search,
  order,
  sortedBy,
}: FetchFaqsParams = {}): Promise<FaqsListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', perPage.toString());

  if (search) params.append('search', search);
  if (order) params.append('order', order);
  if (sortedBy) params.append('sortedBy', sortedBy);

  const { data } = await axiosClient.get<FaqsListResponse>('/faqs?' + params.toString());
  return data;
}

export async function fetchFaqById(id: number): Promise<FaqDetailResponse> {
  const { data } = await axiosClient.get<FaqDetailResponse>('/faqs/' + id);
  return data;
}

export async function createFaq(payload: CreateFaqData): Promise<ApiResponse<Faq>> {
  const { data } = await axiosClient.post<ApiResponse<Faq>>('/faqs', payload);
  return data;
}

export async function updateFaq(id: number, payload: UpdateFaqData): Promise<ApiResponse<Faq>> {
  const { data } = await axiosClient.put<ApiResponse<Faq>>('/faqs/' + id, payload);
  return data;
}

export async function deleteFaq(id: number): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.delete<ApiResponse<null>>('/faqs/' + id);
  return data;
}

export async function reorderFaqs(faqIds: number[]): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.put<ApiResponse<null>>('/faqs/reorder', { faqs: faqIds });
  return data;
}
