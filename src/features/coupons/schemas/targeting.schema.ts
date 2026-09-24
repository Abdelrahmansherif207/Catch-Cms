import { z } from 'zod';
import type { RuleOption } from '../hooks/use-rule-catalog';

export const TARGETING_MODES = [
  'assignment',
  'dynamic',
  'assignment_and_dynamic',
  'assignment_or_dynamic',
] as const;

const ruleNodeSchema = z.object({
  type: z.string().min(1),
  value: z.unknown(),
});

export const targetingFormBaseSchema = z.object({
  mode: z.enum(TARGETING_MODES),
  requireClaim: z.boolean(),
  maxClaims: z
    .number({ message: 'validation.maxClaimsInvalid' })
    .int('validation.maxClaimsInvalid')
    .min(1, 'validation.maxClaimsMin')
    .max(1_000_000, 'validation.maxClaimsMax')
    .nullable(),
  claimTtlHours: z
    .number({ message: 'validation.claimTtlInvalid' })
    .int('validation.claimTtlInvalid')
    .min(1, 'validation.claimTtlMin')
    .max(8760, 'validation.claimTtlMax')
    .nullable(),
  useRuleTree: z.boolean(),
  ruleOperator: z.enum(['AND', 'OR']),
  rules: z.array(ruleNodeSchema),
});

export type TargetingFormValues = z.infer<typeof targetingFormBaseSchema>;

type RuleFormNode = TargetingFormValues['rules'][number];

/**
 * Builds the full form schema against the backend rule catalog.
 * Unknown rule types are rejected (fail-closed, mirroring the
 * backend's `unknown_rule_behavior: reject_422`); each rule's value
 * is validated by its declared `value_type`.
 */
export function buildTargetingSchema(byType: Map<string, RuleOption>) {
  return targetingFormBaseSchema.superRefine((data, ctx) => {
    if (!data.useRuleTree) return;

    if (data.rules.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rules'],
        message: 'validation.ruleTreeEmpty',
      });
      return;
    }

    data.rules.forEach((rule, index) => {
      const def = byType.get(rule.type);
      if (!def) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rules', index],
          message: 'validation.unknownRule',
        });
        return;
      }

      const path = ['rules', index, 'value'] as const;
      const value = rule.value;

      switch (def.valueType) {
        case 'none':
          break;
        case 'integer': {
          if (typeof value !== 'number' || !Number.isInteger(value)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...path], message: 'validation.ruleValueInt' });
          } else if (def.min !== null && value < def.min) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...path], message: 'validation.ruleValueMin' });
          } else if (def.max !== null && value > def.max) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...path], message: 'validation.ruleValueMax' });
          }
          break;
        }
        case 'decimal': {
          if (typeof value !== 'number' || Number.isNaN(value)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...path], message: 'validation.ruleValueRequired' });
          } else if (def.min !== null && value < def.min) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...path], message: 'validation.ruleValueMin' });
          } else if (def.max !== null && value > def.max) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...path], message: 'validation.ruleValueMax' });
          }
          break;
        }
        case 'datetime': {
          if (typeof value !== 'string' || value.trim() === '') {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...path], message: 'validation.ruleDateRequired' });
          }
          break;
        }
        case 'boolean_or_null': {
          if (!(value === true || value === false || value === null || value === undefined)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...path], message: 'validation.ruleValueInvalid' });
          }
          break;
        }
        case 'area_list': {
          if (
            !Array.isArray(value) ||
            value.length === 0 ||
            !value.every((v) => typeof v === 'number' && Number.isInteger(v))
          ) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...path], message: 'validation.areaInRequired' });
          }
          break;
        }
      }
    });
  });
}

export type TargetingRuleFormValue = RuleFormNode;

export function targetingFormDefaults(): TargetingFormValues {
  return {
    mode: 'assignment_and_dynamic',
    requireClaim: true,
    maxClaims: null,
    claimTtlHours: null,
    useRuleTree: false,
    ruleOperator: 'AND',
    rules: [],
  };
}

/** Initial value for a newly added rule, based on its catalog definition. */
export function defaultRuleValue(def: RuleOption): unknown {
  switch (def.valueType) {
    case 'integer':
    case 'decimal':
      return def.min ?? 0;
    case 'datetime':
      return '';
    case 'boolean_or_null':
      return null;
    case 'area_list':
      return [];
    case 'none':
    default:
      return null;
  }
}

function normalizeRuleValue(type: string, value: unknown, byType: Map<string, RuleOption>): unknown {
  const def = byType.get(type);
  if (!def) return value ?? null;
  switch (def.valueType) {
    case 'none':
      return null;
    case 'boolean_or_null':
      return value === true ? true : value === false ? false : null;
    case 'datetime':
      return typeof value === 'string' && value.trim() !== '' ? value : null;
    case 'area_list':
      return Array.isArray(value) ? value : null;
    case 'integer':
    case 'decimal':
    default:
      return typeof value === 'number' ? value : null;
  }
}

export function toTargetingApiFormat(
  values: TargetingFormValues,
  byType: Map<string, RuleOption>
) {
  return {
    mode: values.mode,
    require_claim: values.requireClaim,
    max_claims: values.maxClaims,
    claim_ttl_hours: values.claimTtlHours,
    rule_tree: values.useRuleTree
      ? {
          operator: values.ruleOperator,
          rules: values.rules.map((rule) => ({
            type: rule.type,
            value: normalizeRuleValue(rule.type, rule.value, byType),
          })),
        }
      : null,
  };
}
