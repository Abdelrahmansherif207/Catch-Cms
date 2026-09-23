import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useValidateConfiguration } from '../hooks/use-coupons';
import type { CouponUsageModel, ValidateConfigurationResponse } from '../types/coupon.types';

interface CouponConfigCheckerProps {
  /**
   * Current limiter value from the coupon form (prefills the check).
   * Raw form values can be '' / NaN when the field is empty — normalized
   * to a finite number or null before sending (backend expects
   * `nullable integer`, never an empty string).
   */
  limiter?: number | string | null;
}

function normalizeLimiter(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Pre-save capacity-model sanity check (POST /coupons/validate-configuration).
 * Stateless advisor only — never blocks saving. The API returns HTTP 200 even
 * when `valid: false`, so the result is read from `response.data.valid`.
 */
export function CouponConfigChecker({ limiter }: CouponConfigCheckerProps) {
  const { t } = useTranslation();
  const [couponType, setCouponType] = useState<CouponUsageModel>('public');
  const [limiterInput, setLimiterInput] = useState('');
  const [limiterTouched, setLimiterTouched] = useState(false);
  const [maxUsesPerUser, setMaxUsesPerUser] = useState('1');
  const [result, setResult] = useState<ValidateConfigurationResponse['data'] | null>(null);

  // Prefill the limiter from the coupon form (e.g. once the coupon loads).
  // Stops syncing once the user edits the field here, so their input wins.
  useEffect(() => {
    if (limiterTouched) return;
    setLimiterInput(
      limiter === null || limiter === undefined || String(limiter).trim() === ''
        ? ''
        : String(limiter)
    );
  }, [limiter, limiterTouched]);

  const validateMutation = useValidateConfiguration();

  const handleCheck = () => {
    setResult(null);
    const maxUses = Number(maxUsesPerUser);
    validateMutation.mutate(
      {
        coupon_type: couponType,
        limiter: normalizeLimiter(limiterInput),
        max_uses_per_user: Number.isFinite(maxUses) && maxUses >= 1 ? maxUses : 1,
      },
      {
        onSuccess: (response) => setResult(response.data),
      }
    );
  };

  return (
    <div className="space-y-3 rounded-xl border border-dashed p-3 sm:p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium">{t('coupons.helper.validateTitle')}</p>
      </div>
      <p className="text-xs text-muted-foreground">{t('coupons.helper.validateDesc')}</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <div className="space-y-1.5">
          <label className="text-xs font-medium">{t('coupons.helper.couponType')}</label>
          <Select
            value={couponType}
            onValueChange={(value) => {
              if (value === 'public' || value === 'assigned') setCouponType(value);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">{t('coupons.helper.public')}</SelectItem>
              <SelectItem value="assigned">{t('coupons.helper.assigned')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="helper-max-uses" className="text-xs font-medium">
            {t('coupons.helper.maxUsesPerUser')}
          </label>
          <Input
            id="helper-max-uses"
            type="number"
            min="1"
            value={maxUsesPerUser}
            onChange={(e) => setMaxUsesPerUser(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="helper-limiter" className="text-xs font-medium">
            {t('coupons.helper.limiter')}
          </label>
          <Input
            id="helper-limiter"
            type="number"
            min="1"
            placeholder={t('coupons.helper.unlimited')}
            value={limiterInput}
            onChange={(e) => {
              setLimiterInput(e.target.value);
              setLimiterTouched(true);
            }}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCheck}
            disabled={validateMutation.isPending}
            className="w-full"
          >
            {validateMutation.isPending ? (
              <>
                <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
                {t('coupons.helper.checking')}
              </>
            ) : (
              t('coupons.helper.check')
            )}
          </Button>
        </div>
      </div>

      {result && (
        <div className="space-y-2 pt-1">
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
              result.valid
                ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
            }`}
          >
            {result.valid ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0" />
            )}
            {result.valid ? t('coupons.helper.valid') : t('coupons.helper.invalid')}
          </div>

          {result.errors.map((issue, i) => (
            <div
              key={'err-' + i}
              className="rounded-lg border border-red-200 bg-red-50/60 px-3 py-2 text-sm dark:border-red-900 dark:bg-red-950/40"
            >
              <p className="flex items-center gap-1.5 font-medium text-red-700 dark:text-red-300">
                <XCircle className="h-3.5 w-3.5 shrink-0" />
                {issue.message}
              </p>
              {issue.explanation && (
                <p className="mt-1 text-xs text-red-600/90 dark:text-red-400/90">
                  {issue.explanation}
                </p>
              )}
            </div>
          ))}

          {result.warnings.map((issue, i) => (
            <div
              key={'warn-' + i}
              className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-sm dark:border-amber-900 dark:bg-amber-950/40"
            >
              <p className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {issue.message}
              </p>
              {issue.explanation && (
                <p className="mt-1 text-xs text-amber-600/90 dark:text-amber-400/90">
                  {issue.explanation}
                </p>
              )}
            </div>
          ))}

          {result.recommendations.map((rec, i) => (
            <div
              key={'rec-' + i}
              className="rounded-lg border border-sky-200 bg-sky-50/60 px-3 py-2 text-sm dark:border-sky-900 dark:bg-sky-950/40"
            >
              <p className="flex items-center gap-1.5 font-medium text-sky-700 dark:text-sky-300">
                <Info className="h-3.5 w-3.5 shrink-0" />
                {rec.title}
              </p>
              <p className="mt-1 text-xs text-sky-700/90 dark:text-sky-300/90">
                {rec.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
