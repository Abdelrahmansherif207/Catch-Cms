import { isAxiosError } from 'axios';
import { axiosClient } from '@/shared/api';
import type {
  InvoicesListResponse,
  InvoiceDetailResponse,
  InvoiceVerificationResponse,
  RegenerateInvoiceResponse,
  ApiResponse,
  CorrectInvoicePayload,
  CancelInvoicePayload,
  DebitNotePayload,
  DebitNote,
} from '../types/invoice.types';

export interface FetchInvoicesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  order_id?: number;
  user_id?: number;
  invoice_series?: string;
  currency?: string;
  from?: string;
  to?: string;
  sort_by?: 'created_at' | 'total' | 'status' | 'invoice_number';
  sort_direction?: 'asc' | 'desc';
}

export async function fetchInvoices({
  page = 1,
  limit = 15,
  search,
  status,
  order_id,
  user_id,
  invoice_series,
  currency,
  from,
  to,
  sort_by,
  sort_direction,
}: FetchInvoicesParams = {}): Promise<InvoicesListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (order_id != null) params.append('order_id', String(order_id));
  if (user_id != null) params.append('user_id', String(user_id));
  if (invoice_series) params.append('invoice_series', invoice_series);
  if (currency) params.append('currency', currency);
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  if (sort_by) params.append('sort_by', sort_by);
  if (sort_direction) params.append('sort_direction', sort_direction);

  const { data } = await axiosClient.get<InvoicesListResponse>(`/invoices?${params.toString()}`);
  return data;
}

export async function fetchInvoiceById(id: number): Promise<InvoiceDetailResponse> {
  const { data } = await axiosClient.get<InvoiceDetailResponse>(`/invoices/${id}`);
  return data;
}

export async function fetchInvoiceVerification(uuid: string): Promise<InvoiceVerificationResponse> {
  try {
    const { data } = await axiosClient.get<InvoiceVerificationResponse>(
      `/general/invoices/verify/${uuid}`
    );
    return data;
  } catch (error) {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const body = error.response?.data as InvoiceVerificationResponse | undefined;
      if (status === 409 && body?.data?.tampered !== undefined) {
        return body;
      }
    }
    throw error;
  }
}

interface DownloadUrlResponse {
  url: string;
  invoice_number: string;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadInvoicePdf(
  uuid: string,
  fallbackName?: string | null
): Promise<void> {
  const { data } = await axiosClient.get<ApiResponse<DownloadUrlResponse>>(
    `/invoices/${uuid}/download`
  );
  const payload = data?.data;
  if (!payload?.url) {
    throw new Error(data?.message || 'PDF not yet generated');
  }

  const pdfResponse = await axiosClient.get<Blob>(payload.url, { responseType: 'blob' });
  const safeName = (payload.invoice_number || fallbackName || `invoice-${uuid}`).replace(
    /[^\w.-]+/g,
    '_'
  );
  triggerBlobDownload(pdfResponse.data, `${safeName}.pdf`);
}

export async function regenerateInvoice(id: number): Promise<RegenerateInvoiceResponse> {
  const { data } = await axiosClient.post<RegenerateInvoiceResponse>(`/invoices/${id}/regenerate`);
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
): Promise<ApiResponse<DebitNote>> {
  const { data } = await axiosClient.post<ApiResponse<DebitNote>>(
    `/invoices/${id}/debit-note`,
    payload
  );
  return data;
}
