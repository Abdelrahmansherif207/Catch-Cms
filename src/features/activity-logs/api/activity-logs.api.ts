import { axiosClient } from '@/shared/api';
import type { ActivityLogsResponse } from '../types/activity-log.types';

export interface FetchActivityLogsParams {
  page?: number;
  perPage?: number;
  logName?: string;
  event?: string;
  search?: string;
}

export async function fetchActivityLogs({
  page = 1,
  perPage = 15,
  logName,
  event,
  search,
}: FetchActivityLogsParams = {}): Promise<ActivityLogsResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('per_page', perPage.toString());

  if (logName) params.append('log_name', logName);
  if (event) params.append('event', event);
  if (search) params.append('search', search);

  const { data } = await axiosClient.get<ActivityLogsResponse>('/logs/activity?' + params.toString());
  return data;
}
