export interface ProfilePermission {
  id: number;
  label: string;
}

export interface ProfileData {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  is_active: number;
  image: string | null;
  permissions: ProfilePermission[];
}

export interface ProfileResponse {
  status: number;
  message: string;
  success: boolean;
  data: ProfileData;
}
