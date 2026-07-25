import { axiosClient } from '@/shared/api';
import type {
  ContactListResponse,
  ContactDetailResponse,
  ApiResponse,
  Contact,
} from '../types/contact.types';

export interface FetchContactsParams {
  page?: number;
  perPage?: number;
  search?: string;
  read?: boolean;
  unread?: boolean;
  replay?: boolean;
}

export async function fetchContacts({
  page = 1,
  perPage = 15,
  search,
  read,
  unread,
  replay,
}: FetchContactsParams = {}): Promise<ContactListResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', perPage.toString());

  if (search) params.append('search', search);
  if (read !== undefined) params.append('read', 'true');
  if (unread !== undefined) params.append('unread', 'true');
  if (replay !== undefined) params.append('replay', 'true');

  const { data } = await axiosClient.get<ContactListResponse>('/contacts?' + params.toString());
  return data;
}

export async function fetchContactById(id: number): Promise<ContactDetailResponse> {
  const { data } = await axiosClient.get<ContactDetailResponse>('/contacts/' + id);
  return data;
}

export async function sendReply(
  id: number,
  payload: { subject: string; message: string }
): Promise<ApiResponse<Contact>> {
  const { data } = await axiosClient.post<ApiResponse<Contact>>('/contacts/' + id + '/reply', payload);
  return data;
}

export async function deleteContact(id: number): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.delete<ApiResponse<null>>('/contacts/' + id);
  return data;
}

export async function deleteAllContacts(): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.delete<ApiResponse<null>>('/contacts/delete-all');
  return data;
}

export async function deleteAllReadContacts(): Promise<ApiResponse<null>> {
  const { data } = await axiosClient.delete<ApiResponse<null>>('/contacts/delete-all-read');
  return data;
}
