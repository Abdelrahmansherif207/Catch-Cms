import { axiosClient } from '@/shared/api';
import type {
  InvoicesListResponse,
  InvoiceDetailResponse,
  InvoiceVerificationResponse,
  MyInvoicesListResponse,
  MyInvoiceResponse,
  ApiResponse,
  CorrectInvoicePayload,
  CancelInvoicePayload,
  DebitNotePayload,
} from '../types/invoice.types';

export interface FetchInvoicesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  payment_method?: string;
  currency?: string;
  created_from?: string;
  created_to?: string;
  order_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export async function fetchInvoices({
  page = 1,
  limit = 15,
  search,
  status,
  payment_method,
  currency,
  created_from,
  created_to,
  order_by,
  sort_dir,
}: FetchInvoicesParams = {}): Promise<InvoicesListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (payment_method) params.append('payment_method', payment_method);
  if (currency) params.append('currency', currency);
  if (created_from) params.append('created_from', created_from);
  if (created_to) params.append('created_to', created_to);
  if (order_by) params.append('order_by', order_by);
  if (sort_dir) params.append('sort_dir', sort_dir);

  const { data } = await axiosClient.get<InvoicesListResponse>(`/invoices?${params.toString()}`);
  return data;
}

export async function fetchInvoiceById(id: number): Promise<InvoiceDetailResponse> {
  const { data } = await axiosClient.get<InvoiceDetailResponse>(`/invoices/${id}`);
  return data;
}

export async function fetchMyInvoices(
  page = 1,
  limit = 15
): Promise<MyInvoicesListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  const { data } = await axiosClient.get<MyInvoicesListResponse>(
    `/general/invoices/my-invoices?${params.toString()}`
  );
  return data;
}

export async function fetchMyInvoiceByUuid(uuid: string): Promise<MyInvoiceResponse> {
  const { data } = await axiosClient.get<MyInvoiceResponse>(`/general/orders/invoice/${uuid}`);
  return data;
}

export async function fetchInvoiceVerification(uuid: string): Promise<InvoiceVerificationResponse> {
  const { data } = await axiosClient.get<InvoiceVerificationResponse>(
    `/general/invoices/verify/${uuid}`
  );
  return data;
}

export async function downloadInvoicePdf(uuid: string): Promise<void> {
  const response = await axiosClient.get(`/invoices/${uuid}/download`, { responseType: 'blob' });
  const blob = response.data as Blob;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-${uuid}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function regenerateInvoice(id: number): Promise<ApiResponse<InvoiceDetailResponse>> {
  const { data } = await axiosClient.post<ApiResponse<InvoiceDetailResponse>>(
    `/invoices/${id}/regenerate`
  );
  return data;
}

export async function correctInvoice(
  id: number,
  payload: CorrectInvoicePayload
): Promise<InvoiceDetailResponse> {
  const { data } = await axiosClient.post<InvoiceDetailResponse>(`/invoices/${id}/correct`, payload);
  return data;
}

export async function cancelInvoice(
  id: number,
  payload: CancelInvoicePayload
): Promise<InvoiceDetailResponse> {
  const { data } = await axiosClient.post<InvoiceDetailResponse>(`/invoices/${id}/cancel`, payload);
  return data;
}

export async function issueDebitNote(
  id: number,
  payload: DebitNotePayload
): Promise<InvoiceDetailResponse> {
  const { data } = await axiosClient.post<InvoiceDetailResponse>(`/invoices/${id}/debit-note`, payload);
  return data;
}