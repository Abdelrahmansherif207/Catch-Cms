import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { usePermissions } from '@/shared/auth/guards';
import { useCouponTargeting } from '../hooks/use-coupons';
import { useGovernoratesList } from '../hooks/use-governorates';
import { useRuleCatalog, type RuleOption } from '../hooks/use-rule-catalog';
import { COUPON_PERMISSIONS } from '../permissions/coupon.permissions';
import type { CouponTargeting, RuleTree, TargetingRule } from '../types/coupon.types';
import { TargetingFormDialog } from './targeting-form-dialog';
import { DeleteTargetingDialog } from './delete-targeting-dialog';

const MODE_BADGE_VARIANT: Record<CouponTargeting['mode'], string> = {
  assignment: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  dynamic: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  assignment_and_dynamic: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  assignment_or_dynamic: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
};

interface TargetingSectionProps {
  couponId: number;
}

export function TargetingSection({ couponId }: TargetingSectionProps) {
  const { t } = useTranslation();
  const { canAny } = usePermissions();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canRead = canAny([COUPON_PERMISSIONS.VIEW, COUPON_PERMISSIONS.UPDATE, COUPON_PERMISSIONS.CREATE]);
  const canWrite = canAny([COUPON_PERMISSIONS.UPDATE, COUPON_PERMISSIONS.CREATE]);

  const { data: targeting, isLoading } = useCouponTargeting(couponId);

  if (!canRead) return null;

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{t('coupons.targeting.sectionTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('coupons.targeting.sectionDesc')}</p>
        </div>
        {canWrite && (
          <div className="flex items-center gap-2">
            {targeting && (
              <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="me-1.5 h-4 w-4" />
                {t('coupons.targeting.remove')}
              </Button>
            )}
            <Button size="sm" onClick={() => setFormOpen(true)}>
              {targeting ? (
                <>
                  <Pencil className="me-1.5 h-4 w-4" />
                  {t('coupons.targeting.edit')}
                </>
              ) : (
                <>
                  <Plus className="me-1.5 h-4 w-4" />
                  {t('coupons.targeting.configure')}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-card p-4 shadow-card sm:p-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-52" />
          </div>
        ) : targeting ? (
          <TargetingDetails targeting={targeting} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <ShieldCheck className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">{t('coupons.targeting.notConfigured')}</p>
            <p className="max-w-md text-xs text-muted-foreground">
              {t('coupons.targeting.notConfiguredDesc')}
            </p>
          </div>
        )}
      </div>

      <TargetingFormDialog
        couponId={couponId}
        targeting={targeting ?? null}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      {targeting && (
        <DeleteTargetingDialog
          couponId={couponId}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </div>
  );
}

function TargetingDetails({ targeting }: { targeting: CouponTargeting }) {
  const { t } = useTranslation();
  const { byType } = useRuleCatalog();

  const hasAreaRule = targeting.rule_tree?.rules.some((r) => r.type === 'area_in') ?? false;
  const { items: governorates } = useGovernoratesList(hasAreaRule);
  const areaNames = new Map(governorates.map((g) => [g.id, g.name]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={MODE_BADGE_VARIANT[targeting.mode]}>
          {t('coupons.targeting.modeLabels.' + targeting.mode)}
        </Badge>
        {targeting.require_claim && (
          <Badge variant="outline" className="bg-teal-500/15 text-teal-700 dark:text-teal-400">
            {t('coupons.targeting.requireClaimBadge')}
          </Badge>
        )}
      </div>

      <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
        <DetailRow label={t('coupons.targeting.requireClaim')}>
          {targeting.require_claim ? t('common.yes') : t('common.no')}
        </DetailRow>
        <DetailRow label={t('coupons.targeting.maxClaims')}>
          {targeting.max_claims ?? '—'}
        </DetailRow>
        <DetailRow label={t('coupons.targeting.claimTtl')}>
          {targeting.claim_ttl_hours
            ? t('coupons.targeting.claimTtlValue', { hours: targeting.claim_ttl_hours })
            : '—'}
        </DetailRow>
      </dl>

      <div>
        <p className="mb-1 text-sm font-medium">{t('coupons.targeting.ruleTree')}</p>
        {targeting.rule_tree ? (
          <RuleTreeView tree={targeting.rule_tree} byType={byType} areaNames={areaNames} />
        ) : (
          <p className="text-sm text-muted-foreground">{t('coupons.targeting.noRules')}</p>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 sm:justify-start">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

function RuleTreeView({
  tree,
  byType,
  areaNames,
}: {
  tree: RuleTree;
  byType: Map<string, RuleOption>;
  areaNames: Map<number, string>;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2 rounded-lg border bg-muted/50 p-3">
      <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {t('coupons.targeting.operatorMatch', { operator: tree.operator })}
      </p>
      <ul className="space-y-1.5">
        {tree.rules.map((rule, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <RuleLabel rule={rule} byType={byType} areaNames={areaNames} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function RuleLabel({
  rule,
  byType,
  areaNames,
}: {
  rule: TargetingRule;
  byType: Map<string, RuleOption>;
  areaNames: Map<number, string>;
}) {
  const { t } = useTranslation();
  const def = byType.get(rule.type);

  let valueText = '';
  switch (def?.valueType) {
    case 'integer':
    case 'decimal':
      valueText = typeof rule.value === 'number' ? String(rule.value) : '—';
      break;
    case 'datetime':
      valueText = typeof rule.value === 'string' ? rule.value : '—';
      break;
    case 'boolean_or_null':
      valueText =
        rule.value === true
          ? t('coupons.targeting.booleanYes')
          : rule.value === false
            ? t('coupons.targeting.booleanNo')
            : t('coupons.targeting.booleanAny');
      break;
    case 'area_list': {
      const ids = Array.isArray(rule.value) ? (rule.value as number[]) : [];
      valueText = ids.map((id) => areaNames.get(id) ?? '#' + id).join(', ');
      break;
    }
    default:
      break;
  }

  const label = def?.label ?? rule.type;
  return (
    <span>
      {label}
      {valueText ? <>: <span className="font-medium">{valueText}</span></> : null}
    </span>
  );
}
