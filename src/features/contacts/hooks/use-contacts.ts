import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import {
  fetchContacts,
  fetchContactById,
  sendReply,
  deleteContact,
  deleteAllContacts,
  deleteAllReadContacts,
  type FetchContactsParams,
} from '../api/contacts.api';
import type { ApiErrorResponse } from '@/shared/api';

function handleApiError(error: unknown, fallbackMessage: string): ApiErrorResponse {
  const apiError = error as ApiErrorResponse;
  const message = apiError?.message || fallbackMessage;
  toast.error(message);
  return apiError;
}

export function useContacts(params: FetchContactsParams = {}) {
  return useQuery({
    queryKey: queryKeys.contacts.list(params),
    queryFn: () => fetchContacts(params),
    staleTime: 60 * 1000,
  });
}

export function useContact(id: number | null) {
  return useQuery({
    queryKey: queryKeys.contacts.detail(id!),
    queryFn: () => fetchContactById(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useSendReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, subject, message }: { id: number; subject: string; message: string }) =>
      sendReply(id, { subject, message }),
    onSuccess: (response) => {
      toast.success(response.message || 'Reply sent successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to send reply');
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteContact(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Contact deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete contact');
    },
  });
}

export function useDeleteAllContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteAllContacts(),
    onSuccess: (response) => {
      toast.success(response.message || 'All contacts deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete all contacts');
    },
  });
}

export function useDeleteAllReadContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteAllReadContacts(),
    onSuccess: (response) => {
      toast.success(response.message || 'All read contacts deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
    onError: (error: unknown) => {
      handleApiError(error, 'Failed to delete read contacts');
    },
  });
}
