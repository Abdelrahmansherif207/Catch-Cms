import type { LocalizedName } from '@/shared/lib/localize';

export type ShippingTypeName = 'local' | 'international';

export type FlowInputType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'select'
  | 'multi_select';

export type FlowInputSource =
  | 'countries'
  | 'governorates'
  | 'warehouses'
  | 'pickup_locations';

export interface FlowInputValidation {
  options?: string[];
  min?: number;
  max?: number;
  pattern?: string;
}

export interface OrderFlowInput {
  id: number;
  flow_id: number;
  key: string;
  label: LocalizedName;
  placeholder?: LocalizedName | null;
  help_text?: LocalizedName | null;
  type: FlowInputType;
  source?: FlowInputSource | null;
  required: boolean;
  required_at: string;
  sort_order: number;
  validation?: FlowInputValidation | null;
  is_active: boolean;
}

export interface OrderFlowStatus {
  id: number;
  code: string;
  name: LocalizedName;
  is_active: boolean;
  sort_order: number;
}

export interface OrderFlow {
  id: number;
  code: string;
  name: LocalizedName | string;
  shipping_type: ShippingTypeName;
  is_default: boolean;
  is_active: boolean;
  statuses?: OrderFlowStatus[];
  inputs?: OrderFlowInput[];
}

export interface OrderStatusCatalogItem {
  id: number;
  code: string;
  name: LocalizedName | string;
  description?: string | null;
  is_active: boolean;
}

export interface FlowListParams {
  page?: number;
  shipping_type?: ShippingTypeName;
  is_active?: boolean;
  search?: string;
  per_page?: number;
}

export interface StatusListParams {
  page?: number;
  search?: string;
  is_active?: boolean;
  per_page?: number;
}

export interface CreateFlowPayload {
  code: string;
  name: string | LocalizedName;
  shipping_type: ShippingTypeName;
  is_default?: boolean;
  is_active?: boolean;
  status_ids: number[];
}

export type UpdateFlowPayload = Partial<CreateFlowPayload>;

export interface UpdateFlowStatusPayload {
  name?: string | LocalizedName;
  description?: string | null;
  is_active?: boolean;
}

export interface CreateFlowInputsPayload {
  key: string;
  label: LocalizedName;
  placeholder?: LocalizedName;
  help_text?: LocalizedName;
  type: FlowInputType;
  source?: FlowInputSource;
  required?: boolean;
  required_at?: string;
  sort_order?: number;
  validation?: FlowInputValidation;
  is_active?: boolean;
}

export type UpdateFlowInputPayload = Partial<CreateFlowInputsPayload>;
