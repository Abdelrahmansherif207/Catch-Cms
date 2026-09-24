export interface CouponImage {
  desktop: string | null;
  mobile: string | null;
}

export interface Coupon {
  id: number;
  code: string;
  name: string;
  image: CouponImage;
  borderColor: string | null;
  borderless: boolean;
  discount: string;
  discount_type: string;
  max_discount_amount: string | null;
  start_date: string;
  end_date: string;
  limiter: number | null;
  used: number;
  status: boolean;
  is_valid: boolean;
  created_at: string;
}

export interface CouponListOriginal {
  data: Coupon[];
  current_page: number;
  from: number;
  to: number;
  last_page: number;
  path: string;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
  last_page_url: string;
  first_page_url: string;
}

export interface CouponListResponse {
  status: number;
  message: string;
  success: boolean;
  data: CouponListOriginal;
}

export interface CouponDetailResponse {
  status: number;
  message: string;
  success: boolean;
  data: Coupon;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export interface CreateCouponData {
  'name[en]': string;
  'name[ar]': string;
  discount?: string;
  discount_type: string;
  max_discount_amount?: string;
  start_date: string;
  end_date: string;
  limiter?: string;
  status: string;
  border_color?: string;
  borderless?: string;
  'image-desktop': File;
  'image-mobile': File;
}

export interface UpdateCouponData {
  _method: 'PUT';
  'name[en]'?: string;
  'name[ar]'?: string;
  discount?: string;
  discount_type?: string;
  max_discount_amount?: string;
  start_date?: string;
  end_date?: string;
  limiter?: string;
  status?: string;
  border_color?: string;
  borderless?: string;
  'image-desktop'?: File;
  'image-mobile'?: File;
}

export interface CouponAssignment {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_avatar: string | null;
  max_uses: number;
  used: number;
  remaining: number;
  expires_at: string | null;
  is_expired: boolean;
  created_at: string;
}

export interface AssignmentListOriginal {
  data: CouponAssignment[];
  current_page: number;
  from: number;
  to: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AssignmentListResponse {
  status: number;
  message: string;
  success: boolean;
  data: AssignmentListOriginal;
}

export interface CreateAssignmentPayload {
  user_id: number;
  max_uses: number;
  expires_at?: string | null;
}

export interface UpdateAssignmentPayload {
  max_uses: number;
  expires_at?: string | null;
}

/* ------------------------------------------------------------------ */
/* Coupon Helper: validate-configuration (POST /coupons/validate-configuration) */
/* ------------------------------------------------------------------ */

export type CouponUsageModel = 'public' | 'assigned';

export interface ValidateConfigurationPayload {
  coupon_type: CouponUsageModel;
  limiter?: number | null;
  max_uses_per_user?: number | null;
}

export interface ConfigurationIssue {
  field: string;
  message: string;
  explanation?: string;
}

export interface ConfigurationRecommendation {
  title: string;
  description: string;
}

export interface ValidateConfigurationData {
  valid: boolean;
  errors: ConfigurationIssue[];
  warnings: ConfigurationIssue[];
  recommendations: ConfigurationRecommendation[];
}

export type ValidateConfigurationResponse = ApiResponse<ValidateConfigurationData>;

/* ------------------------------------------------------------------ */
/* Coupon Helper: usage-info (GET /coupons/{id}/usage-info) */
/* ------------------------------------------------------------------ */

export interface CouponAssignmentInfo {
  total_assignments: number;
  assignments_with_usage: number;
  max_uses_per_user: number;
  total_possible_redemptions: number;
}

export interface CouponUsageInfo {
  coupon_code: string;
  coupon_type: CouponUsageModel;
  usage_model: string;
  current_usage: number;
  global_limit: number | null;
  remaining_capacity: number | 'unlimited';
  is_multi_use_per_user: boolean;
  assignment_info: CouponAssignmentInfo | null;
  public_usage_count: number;
}

export type CouponUsageInfoResponse = ApiResponse<CouponUsageInfo>;

/* ------------------------------------------------------------------ */
/* Coupon Helper: suggest-fix (POST /coupons/{id}/suggest-fix) */
/* ------------------------------------------------------------------ */

export type DesiredCouponBehavior = 'multi_use_per_user' | 'single_use_per_user';

export interface SuggestFixPayload {
  desired_behavior: DesiredCouponBehavior;
}

export interface SuggestFixData {
  recommended_action: string;
  current_config?: string;
  current_issue?: string;
  message?: string;
  steps?: string[];
  example_code?: string;
}

export type SuggestFixResponse = ApiResponse<SuggestFixData>;

export type TargetingMode =
  | 'assignment'
  | 'dynamic'
  | 'assignment_and_dynamic'
  | 'assignment_or_dynamic';

export type RuleValueType =
  | 'integer'
  | 'decimal'
  | 'datetime'
  | 'none'
  | 'boolean_or_null'
  | 'area_list';

export interface LocalizedText {
  en: string;
  ar: string;
}

export interface RuleDefinition {
  type: string;
  label: LocalizedText;
  description: LocalizedText;
  value_type: RuleValueType;
  value_required: boolean;
  value_example: unknown;
  min: number | null;
  max: number | null;
  allowed_values: unknown[] | null;
  date_format: string | null;
  context: string;
}

export interface RuleCatalog {
  rules: RuleDefinition[];
  rule_tree: {
    supported: boolean;
    operators: string[];
    max_depth: number;
    nested_groups_allowed: boolean;
  };
}

export interface RuleCatalogResponse {
  status: number;
  message: string;
  success: boolean;
  data: RuleCatalog;
}

export interface TargetingRule {
  type: string;
  value: unknown;
}

export interface RuleTree {
  operator: 'AND' | 'OR';
  rules: TargetingRule[];
}

export interface CouponTargeting {
  id: number;
  coupon_id: number;
  mode: TargetingMode;
  require_claim: boolean;
  max_claims: number | null;
  claim_ttl_hours: number | null;
  rule_tree: RuleTree | null;
  created_at: string;
  updated_at: string;
}

export interface CouponTargetingResponse {
  status: number;
  message: string;
  success: boolean;
  data: CouponTargeting;
}

export interface UpsertTargetingPayload {
  mode: TargetingMode;
  require_claim: boolean;
  max_claims?: number | null;
  claim_ttl_hours?: number | null;
  rule_tree?: RuleTree | null;
}
