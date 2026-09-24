import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { getStoredLanguage } from '@/shared/api/language-utils';
import { fetchCouponRuleCatalog } from '../api/coupons.api';
import type { RuleDefinition, RuleValueType } from '../types/coupon.types';

export interface RuleOption {
  type: string;
  label: string;
  description: string;
  valueType: RuleValueType;
  valueRequired: boolean;
  min: number | null;
  max: number | null;
  allowedValues: unknown[] | null;
}

/** Static, long-lived catalog of every targeting rule type the backend supports. */
export function useRuleCatalog() {
  const query = useQuery({
    queryKey: queryKeys.coupons.rules(),
    queryFn: fetchCouponRuleCatalog,
    staleTime: 30 * 60 * 1000,
  });

  const lang = getStoredLanguage();

  const options = useMemo<RuleOption[]>(() => {
    const rules = query.data?.data.rules ?? [];
    return rules.map((def: RuleDefinition) => ({
      type: def.type,
      label: def.label?.[lang] || def.label?.en || def.type,
      description: def.description?.[lang] || def.description?.en || '',
      valueType: def.value_type,
      valueRequired: def.value_required,
      min: def.min,
      max: def.max,
      allowedValues: def.allowed_values,
    }));
  }, [query.data, lang]);

  const byType = useMemo(() => {
    const map = new Map<string, RuleOption>();
    for (const option of options) map.set(option.type, option);
    return map;
  }, [options]);

  return { rules: options, byType, isLoading: query.isLoading };
}
