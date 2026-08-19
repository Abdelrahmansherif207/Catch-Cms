import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import type { ApiErrorResponse } from '@/shared/api';
import {
  fetchInvoices,
  fetchInvoiceById,
  fetchMyInvoices,
  fetchMyInvoiceByUuid,
  fetchInvoiceVerification,
  downloadInvoicePdf,
  regenerateInvoice,
  correctInvoice,
  cancelInvoice,
  issueDebitNote,
  type FetchInvoicesParams,
} from '../api/invoices.api';
import { isPdfPending } from '../lib/invoice-utils';
import { invoiceRoutes } from '../routes/invoice.routes';
import type { InvoiceDetailResponse } from '../types/invoice.types';

function handleApiError(error: unknown, fallbackMessage: string) {
  const apiError = error as ApiErrorResponse;
  toast.error(apiError?.message || fallbackMessage);
}

export function useInvoices(params: FetchInvoicesParams = {}) {
  return useQuery({
    queryKey: queryKeys.invoices.list(params),
    queryFn: () => fetchInvoices(params),
    staleTime: 60 * 1000,
  });
}

export function useInvoice(id: number | undefined, options?: { pollPdf?: boolean }) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id ?? ''),
    queryFn: () => fetchInvoiceById(id as number),
    enabled: id !== undefined,
    refetchInterval: (query) => {
      if (!options?.pollPdf) return false;
      const detail = (query.state.data as InvoiceDetailResponse | undefined)?.data;
      return detail && isPdfPending(detail.status) ? 3000 : false;
    },
  });
}

export function useRegenerateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => regenerateInvoice(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Invoice regeneration started');
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.details() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to regenerate invoice');
    },
  });
}

export function useCorrectInvoice() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof correctInvoice>[1] }) =>
      correctInvoice(id, data),
    onSuccess: (response) => {
      const message = (response as { message?: string }).message || 'Invoice corrected successfully';
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.details() });
      const correction = (response as { data?: { id?: number } }).data;
      navigate(correction?.id ? invoiceRoutes.detail(correction.id) : invoiceRoutes.list);
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to correct invoice');
    },
  });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof cancelInvoice>[1] }) =>
      cancelInvoice(id, data),
    onSuccess: (response) => {
      toast.success(response.message || 'Invoice cancelled successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.details() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to cancel invoice');
    },
  });
}

export function useIssueDebitNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof issueDebitNote>[1] }) =>
      issueDebitNote(id, data),
    onSuccess: (response) => {
      toast.success(response.message || 'Debit note issued successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.details() });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to issue debit note');
    },
  });
}

export function useInvoiceDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  const download = async (uuid: string) => {
    setIsDownloading(true);
    try {
      await downloadInvoicePdf(uuid);
      toast.success('Invoice PDF downloaded');
    } catch (error) {
      handleApiError(error, 'Failed to download invoice');
    } finally {
      setIsDownloading(false);
    }
  };
  return { download, isDownloading };
}

export function useMyInvoices(page = 1, limit = 15) {
  return useQuery({
    queryKey: queryKeys.invoices.myInvoices.list({ page, limit }),
    queryFn: () => fetchMyInvoices(page, limit),
    staleTime: 60 * 1000,
  });
}

export function useMyInvoice(uuid: string | undefined) {
  return useQuery({
    queryKey: queryKeys.invoices.myInvoices.detail(uuid ?? ''),
    queryFn: () => fetchMyInvoiceByUuid(uuid as string),
    enabled: uuid !== undefined,
  });
}

export function useVerifyInvoice(uuid: string | undefined) {
  return useQuery({
    queryKey: queryKeys.invoices.verify(uuid ?? ''),
    queryFn: () => fetchInvoiceVerification(uuid as string),
    enabled: uuid !== undefined,
    retry: false,
  });
}