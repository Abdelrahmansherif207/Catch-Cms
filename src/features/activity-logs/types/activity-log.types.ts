export interface ActivityLog {
  id: number;
  log_name: string;
  description: string;
  event: string;
  subject_type: string;
  subject_id: number;
  causer_type: string;
  causer_id: number;
  properties: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MetaData {
  current_page: number;
  from: number;
  to: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ActivityLogsResponse {
  success: boolean;
  message: string;
  data: ActivityLog[];
  meta: MetaData;
}
