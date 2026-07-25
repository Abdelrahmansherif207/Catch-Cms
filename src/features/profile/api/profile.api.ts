import { axiosClient } from '@/shared/api';
import type { ProfileResponse } from '../types/profile.types';

export async function fetchProfile(): Promise<ProfileResponse> {
  const { data } = await axiosClient.get<ProfileResponse>('/me');
  return data;
}
