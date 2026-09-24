import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Loader2, Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useGovernoratesList } from '../hooks/use-governorates';
import { useRuleCatalog } from '../hooks/use-rule-catalog';
import { useCouponTargeting, useUpsertTargeting } from '../hooks/use-coupons';
import {
  buildTargetingSchema,
  targetingFormDefaults,
  toTargetingApiFormat,
  defaultRuleValue,
  type TargetingFormValues,
  type TargetingRuleFormValue,
} from '../schemas/targeting.schema';
import type { CouponTargeting } from '../types/coupon.types';
import type { ApiErrorResponse } from '@/shared/api';

const MODES = [
  'assignment',
  'dynamic',
  'assignment_and_dynamic',
  'assignment_or_dynamic',
] as const;

interface TargetingFormDialogProps {
  couponId: number;
  /**
   * Current targeting config. Omit to let the dialog fetch it itself
   * (e.g. when opened from the coupons list where no targeting data is loaded).
   */
  targeting?: CouponTargeting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formValuesFromTargeting(targeting: CouponTargeting | null): TargetingFormValues {
  if (!targeting) return targetingFormDefaults();
  return {
    mode: targeting.mode,
    requireClaim: targeting.require_claim,
    maxClaims: targeting.max_claims,
    claimTtlHours: targeting.claim_ttl_hours,
    useRuleTree: targeting.rule_tree !== null,
    ruleOperator: targeting.rule_tree?.operator ?? 'AND',
    rules: (targeting.rule_tree?.rules ?? []) as TargetingRuleFormValue[],
  };
}

export function TargetingFormDialog({
  couponId,
  targeting,
  open,
  onOpenChange,
}: TargetingFormDialogProps) {
  const { t } = useTranslation();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const upsertMutation = useUpsertTargeting(couponId);
  const { rules: catalogRules, byType } = useRuleCatalog();

  const targetingProvided = targeting !== undefined;
  const internalQuery = useCouponTargeting(couponId);
  const isResolving = !targetingProvided && internalQuery.isLoading;
  const resolveFailed = !targetingProvided && internalQuery.isError;
  const effectiveTargeting = targetingProvided ? targeting : (internalQuery.data ?? null);

  const schema = useMemo(() => buildTargetingSchema(byType), [byType]);

  const form = useForm<TargetingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: formValuesFromTargeting(effectiveTargeting),
  });

  useEffect(() => {
    if (targetingProvided || !internalQuery.isSuccess) return;
    form.reset(formValuesFromTargeting(internalQuery.data ?? null));
  }, [targetingProvided, internalQuery.isSuccess, internalQuery.data, form]);

  const useRuleTree = form.watch('useRuleTree');
  const rules = form.watch('rules');
  const ruleOperator = form.watch('ruleOperator');
  const selectedMode = form.watch('mode');

  const { items: governorates, isLoading: governoratesLoading } = useGovernoratesList(open);

  const addRule = (type: string) => {
    const def = byType.get(type);
    if (!def) return;
    const next: TargetingRuleFormValue = { type, value: defaultRuleValue(def) };
    form.setValue('rules', [...rules, next], { shouldValidate: false });
  };

  const removeRule = (index: number) => {
    form.setValue(
      'rules',
      rules.filter((_, i) => i !== index),
      { shouldValidate: true }
    );
  };

  const updateRule = (index: number, next: TargetingRuleFormValue) => {
    form.setValue(
      'rules',
      rules.map((r, i) => (i === index ? next : r)),
      { shouldValidate: true }
    );
  };

  const toggleArea = (rule: TargetingRuleFormValue, index: number, areaId: number) => {
    const current = Array.isArray(rule.value) ? (rule.value as number[]) : [];
    const nextValue = current.includes(areaId)
      ? current.filter((id) => id !== areaId)
      : [...current, areaId];
    updateRule(index, { type: rule.type, value: nextValue });
  };

  const onSubmit = (values: TargetingFormValues) => {
    setServerErrors({});
    upsertMutation.mutate(toTargetingApiFormat(values, byType), {
      onSuccess: () => {
        onOpenChange(false);
      },
      onError: (error: unknown) => {
        const apiError = error as ApiErrorResponse;
        if (apiError?.status === 422 && apiError.errors) {
          setServerErrors(apiError.errors);
        }
      },
    });
  };

  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof TargetingFormValues]?.message as string | undefined;
    const serverErr =
      serverErrors[field]?.[0] ??
      Object.entries(serverErrors).find(([key]) => key.startsWith(field))?.[1]?.[0];
    return clientErr || serverErr;
  };

  const getRuleError = (index: number): string | undefined => {
    const clientErr =
      (errors.rules?.[index]?.value?.message ||
        errors.rules?.[index]?.type?.message) as string | undefined;
    const serverErr = Object.entries(serverErrors).find(([key]) =>
      key.startsWith(`rule_tree.rules.${index}`)
    )?.[1]?.[0];
    return clientErr || serverErr;
  };

  const rulesError =
    (errors.rules?.message as string | undefined) ||
    Object.entries(serverErrors).find(([key]) => key.startsWith('rule_tree'))?.[1]?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {effectiveTargeting
              ? t('coupons.targeting.editTitle')
              : t('coupons.targeting.configureTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('coupons.targeting.configureDesc')}
          </DialogDescription>
        </DialogHeader>

        {isResolving ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : resolveFailed ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-destructive">{t('coupons.targeting.loadError')}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => internalQuery.refetch()}
            >
              {t('common.retry')}
            </Button>
          </div>
        ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t('coupons.targeting.mode')} *
              </label>
              <Select
                value={selectedMode}
                onValueChange={(value) => {
                  if (value && MODES.includes(value as TargetingFormValues['mode'])) {
                    form.setValue('mode', value as TargetingFormValues['mode']);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('coupons.targeting.mode')}>
                    {t('coupons.targeting.modeLabels.' + selectedMode)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {t('coupons.targeting.modeLabels.' + mode)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('coupons.targeting.modeHints.' + selectedMode)}
              </p>
              {getError('mode') && (
                <p className="text-xs text-destructive">{getError('mode')}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('coupons.targeting.claimTtl')}</label>
              <Input
                type="number"
                min={1}
                max={8760}
                placeholder={t('coupons.targeting.claimTtlPlaceholder')}
                value={form.watch('claimTtlHours') ?? ''}
                onChange={(e) =>
                  form.setValue(
                    'claimTtlHours',
                    e.target.value === '' ? null : Math.trunc(Number(e.target.value)),
                    { shouldValidate: true }
                  )
                }
              />
              {getError('claimTtlHours') && (
                <p className="text-xs text-destructive">{getError('claimTtlHours')}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('coupons.targeting.maxClaims')}</label>
              <Input
                type="number"
                min={1}
                max={1000000}
                placeholder={t('coupons.targeting.maxClaimsPlaceholder')}
                value={form.watch('maxClaims') ?? ''}
                onChange={(e) =>
                  form.setValue(
                    'maxClaims',
                    e.target.value === '' ? null : Math.trunc(Number(e.target.value)),
                    { shouldValidate: true }
                  )
                }
              />
              {getError('maxClaims') && (
                <p className="text-xs text-destructive">{getError('maxClaims')}</p>
              )}
            </div>

            <div className="flex items-end pb-2">
              <label className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={form.watch('requireClaim')}
                  onCheckedChange={(checked) =>
                    form.setValue('requireClaim', checked === true)
                  }
                />
                <span className="text-sm font-medium">
                  {t('coupons.targeting.requireClaim')}
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={useRuleTree}
                onCheckedChange={(checked) =>
                  form.setValue('useRuleTree', checked === true, { shouldValidate: true })
                }
              />
              <span className="text-sm font-medium">{t('coupons.targeting.useRuleTree')}</span>
            </label>

            {useRuleTree && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">
                    {t('coupons.targeting.operator')}
                  </label>
                  <Select
                    value={ruleOperator}
                    onValueChange={(value) => {
                      if (value === 'AND' || value === 'OR') {
                        form.setValue('ruleOperator', value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {ruleOperator === 'AND'
                          ? t('coupons.targeting.operatorAnd')
                          : t('coupons.targeting.operatorOr')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">{t('coupons.targeting.operatorAnd')}</SelectItem>
                      <SelectItem value="OR">{t('coupons.targeting.operatorOr')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {rules.map((rule, index) => (
                  <RuleRow
                    key={index}
                    rule={rule}
                    index={index}
                    definition={byType.get(rule.type)}
                    governorates={governorates}
                    governoratesLoading={governoratesLoading}
                    error={getRuleError(index)}
                    onChange={(next) => updateRule(index, next)}
                    onRemove={() => removeRule(index)}
                    onToggleArea={(areaId) => toggleArea(rule, index, areaId)}
                  />
                ))}

                <div className="flex items-center gap-2">
                  <Select value="" onValueChange={(value) => { if (value) addRule(value); }}>
                    <SelectTrigger size="sm" className="w-full">
                      <SelectValue placeholder={t('coupons.targeting.addRule')}>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Plus className="h-4 w-4" />
                          {t('coupons.targeting.addRule')}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {catalogRules.map((def) => (
                        <SelectItem key={def.type} value={def.type}>
                          {def.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {rulesError && (
                  <p className="text-xs text-destructive">{rulesError}</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={upsertMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {upsertMutation.isPending
                ? t('coupons.targeting.saving')
                : t('coupons.targeting.save')}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface RuleRowProps {
  rule: TargetingRuleFormValue;
  index: number;
  definition?: {
    label: string;
    description: string;
    valueType: string;
    min: number | null;
    max: number | null;
  };
  governorates: Array<{ id: number; name: string }>;
  governoratesLoading: boolean;
  error?: string;
  onChange: (next: TargetingRuleFormValue) => void;
  onRemove: () => void;
  onToggleArea: (areaId: number) => void;
}

function RuleRow({
  rule,
  index,
  definition,
  governorates,
  governoratesLoading,
  error,
  onChange,
  onRemove,
  onToggleArea,
}: RuleRowProps) {
  const { t } = useTranslation();
  const [areaOpen, setAreaOpen] = useState(false);

  const valueType = definition?.valueType;

  const numberValue = typeof rule.value === 'number' ? rule.value : '';
  const onNumberChange = (raw: string) => {
    if (raw === '') {
      onChange({ type: rule.type, value: valueType === 'integer' ? NaN : NaN });
      return;
    }
    const num = valueType === 'integer' ? Math.trunc(Number(raw)) : Number(raw);
    onChange({ type: rule.type, value: Number.isNaN(num) ? NaN : num });
  };

  return (
    <div className="space-y-1.5 rounded-lg border bg-muted/30 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-24 shrink-0 text-xs font-semibold text-muted-foreground">
          #{index + 1}
        </span>
        <span className="flex-1 text-sm font-medium">
          {definition?.label ?? rule.type}
        </span>

        {valueType === 'integer' || valueType === 'decimal' ? (
          <Input
            type="number"
            step={valueType === 'decimal' ? '0.01' : '1'}
            min={definition?.min ?? undefined}
            max={definition?.max ?? undefined}
            className="w-28"
            value={Number.isFinite(numberValue) ? numberValue : ''}
            onChange={(e) => onNumberChange(e.target.value)}
          />
        ) : valueType === 'datetime' ? (
          <Input
            type="date"
            className="w-40"
            value={typeof rule.value === 'string' ? rule.value : ''}
            onChange={(e) => onChange({ type: rule.type, value: e.target.value })}
          />
        ) : valueType === 'boolean_or_null' ? (
          <Select
            value={rule.value === true ? 'yes' : rule.value === false ? 'no' : 'any'}
            onValueChange={(value) => {
              if (value === 'yes' || value === 'no' || value === 'any') {
                onChange({
                  type: rule.type,
                  value: value === 'yes' ? true : value === 'no' ? false : null,
                });
              }
            }}
          >
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t('coupons.targeting.booleanAny')}</SelectItem>
              <SelectItem value="yes">{t('coupons.targeting.booleanYes')}</SelectItem>
              <SelectItem value="no">{t('coupons.targeting.booleanNo')}</SelectItem>
            </SelectContent>
          </Select>
        ) : valueType === 'area_list' ? (
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAreaOpen(!areaOpen)}
            >
              {Array.isArray(rule.value) && (rule.value as number[]).length > 0
                ? t('coupons.targeting.areasSelected', {
                    count: (rule.value as number[]).length,
                  })
                : t('coupons.targeting.selectAreas')}
              <ChevronDown className="ms-1 h-4 w-4" />
            </Button>
            {areaOpen && (
              <div className="absolute top-full z-20 mt-1 max-h-48 w-64 overflow-y-auto rounded-lg border bg-popover p-2 shadow-md">
                {governoratesLoading ? (
                  <p className="p-2 text-xs text-muted-foreground">{t('common.loading')}</p>
                ) : (
                  governorates.map((g) => (
                    <label
                      key={g.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <Checkbox
                        checked={(Array.isArray(rule.value) ? (rule.value as number[]) : []).includes(g.id)}
                        onCheckedChange={() => onToggleArea(g.id)}
                      />
                      {g.name}
                    </label>
                  ))
                )}
                {!governoratesLoading && governorates.length === 0 && (
                  <p className="p-2 text-xs text-muted-foreground">{t('common.noData')}</p>
                )}
              </div>
            )}
          </div>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="ms-auto"
          onClick={onRemove}
          aria-label={t('common.delete')}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {definition?.description && (
        <p className="text-xs text-muted-foreground">{definition.description}</p>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
