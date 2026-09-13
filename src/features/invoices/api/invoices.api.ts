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

export async function fetchInvoiceByUuid(uuid: string): Promise<InvoiceDetailResponse> {
  const { data } = await axiosClient.get<InvoiceDetailResponse>(`/invoices/uuid/${uuid}`);
  return data;
}

export async function fetchInvoiceVerification(uuid: string): Promise<InvoiceVerificationResponse> {
  try {
    // Dashboard admin verify per contract: GET /api/v1/invoices/verify/{uuid}
    // (auth:sanctum + throttle:5,1, no permission required).
    const { data } = await axiosClient.get<InvoiceVerificationResponse>(
      `/invoices/verify/${uuid}`
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

function filenameFromDisposition(disposition: string | undefined, fallback: string): string {
  if (disposition) {
    // RFC 5987 (filename*=UTF-8'') first, then plain filename="..."
    const star = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
    if (star?.[1]) {
      try {
        return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ''));
      } catch {
        /* fall through */
      }
    }
    const plain = disposition.match(/filename\s*=\s*"?([^";]+)"?/i);
    if (plain?.[1]) return plain[1].trim();
  }
  return fallback;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.-]+/g, '_') || 'invoice.pdf';
}

/**
 * Contract: GET /invoices/{uuid}/download streams binary PDF bytes
 * (`Content-Type: application/pdf`, `Content-Disposition: attachment`).
 * Single request with responseType blob — no intermediate JSON {url} step.
 * 404 = unknown uuid / privacy owner-check / pdf not generated / file missing.
 */
async function throwParsedBlobError(error: unknown): Promise<never> {
  // When responseType is blob, even JSON error envelopes arrive as Blob.
  // Parse them so toasts show "PDF not yet generated" / "Not found" / throttles.
  const { isAxiosError } = await import('axios');
  if (isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const text = await (error.response.data as Blob).text();
      const parsed = JSON.parse(text) as { message?: string; errors?: Record<string, string[]> };
      const status = error.response.status;
      throw {
        status,
        message: parsed?.message || (status === 404 ? 'PDF not yet generated' : 'Request failed'),
        success: false,
        errors: parsed?.errors,
      };
    } catch (parseError) {
      if ((parseError as { status?: number })?.status != null) throw parseError;
    }
  }
  throw error;
}

export async function downloadInvoicePdf(
  uuid: string,
  fallbackName?: string | null
): Promise<void> {
  try {
    const response = await axiosClient.get<Blob>(`/invoices/${uuid}/download`, {
      responseType: 'blob',
    });
    const disposition = response.headers?.['content-disposition'] as string | undefined;
    const fallback = `${fallbackName || `invoice-${uuid}`}.pdf`;
    triggerBlobDownload(
      response.data,
      sanitizeFilename(filenameFromDisposition(disposition, fallback))
    );
  } catch (error) {
    return throwParsedBlobError(error);
  }
}

/**
 * Contract: GET /invoices/{uuid}/view streams binary PDF bytes inline
 * (`Content-Disposition: inline`). Same auth chain as download, but does
 * NOT record download bookkeeping. Returns a blob URL for <iframe>/new-tab.
 */
export async function fetchInvoicePdfBlobUrl(uuid: string): Promise<string> {
  try {
    const response = await axiosClient.get<Blob>(`/invoices/${uuid}/view`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(response.data);
  } catch (error) {
    return throwParsedBlobError(error);
  }
}

export function revokeBlobUrl(url: string) {
  URL.revokeObjectURL(url);
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
