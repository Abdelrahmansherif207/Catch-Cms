import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { usePermissions } from '@/shared/auth/guards';
import { useSuggestFix } from '../hooks/use-coupons';
import type { DesiredCouponBehavior, SuggestFixResponse } from '../types/coupon.types';

interface SuggestFixPanelProps {
  couponId: number;
}

/**
 * Single<->multi-use diagnostic advisor (POST /coupons/{id}/suggest-fix).
 * Read-only: renders recommendations only, mutates nothing.
 */
export function SuggestFixPanel({ couponId }: SuggestFixPanelProps) {
  const { t } = useTranslation();
  const { isSuperAdmin } = usePermissions();
  const [desiredBehavior, setDesiredBehavior] =
    useState<DesiredCouponBehavior>('multi_use_per_user');
  const [result, setResult] = useState<SuggestFixResponse['data'] | null>(null);

  const suggestMutation = useSuggestFix(couponId);

  if (!isSuperAdmin) return null;

  const handleSuggest = () => {
    setResult(null);
    suggestMutation.mutate(
      { desired_behavior: desiredBehavior },
      { onSuccess: (response) => setResult(response.data) }
    );
  };

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{t('coupons.helper.suggestTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('coupons.helper.suggestDesc')}</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4 shadow-card sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[18rem_auto] sm:items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              {t('coupons.helper.desiredBehavior')}
            </label>
            <Select
              value={desiredBehavior}
              onValueChange={(value) => {
                if (value === 'multi_use_per_user' || value === 'single_use_per_user') {
                  setDesiredBehavior(value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multi_use_per_user">
                  {t('coupons.helper.multiUsePerUser')}
                </SelectItem>
                <SelectItem value="single_use_per_user">
                  {t('coupons.helper.singleUsePerUser')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleSuggest}
              disabled={suggestMutation.isPending}
              className="w-full sm:w-auto"
            >
            {suggestMutation.isPending ? (
              <>
                <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
                {t('coupons.helper.gettingSuggestion')}
              </>
            ) : (
              <>
                <Lightbulb className="me-1.5 h-4 w-4" />
                {t('coupons.helper.getSuggestion')}
              </>
            )}
          </Button>
        </div>
        </div>

        {result && (
          <div className="mt-4 space-y-3 rounded-xl border bg-muted/30 p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{result.recommended_action}</Badge>
            </div>

            {(result.current_issue || result.current_config || result.message) && (
              <p className="text-sm text-muted-foreground">
                {result.current_issue ?? result.current_config ?? result.message}
              </p>
            )}

            {result.steps && result.steps.length > 0 && (
              <div>
                <p className="mb-1.5 text-sm font-medium">{t('coupons.helper.steps')}</p>
                <ol className="list-decimal space-y-1 ps-5 text-sm text-muted-foreground">
                  {result.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {result.example_code && (
              <div>
                <p className="mb-1.5 text-sm font-medium">
                  {t('coupons.helper.exampleCode')}
                </p>
                <pre
                  dir="ltr"
                  className="overflow-x-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-100"
                >
                  <code>{result.example_code}</code>
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
