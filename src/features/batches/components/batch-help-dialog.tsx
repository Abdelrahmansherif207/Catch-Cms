import { useTranslation } from 'react-i18next';
import {
  ClipboardList,
  Info,
  PlayCircle,
  UserCheck,
  Waves,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';

const FLOW_STEPS = [
  { key: 'create', icon: Waves },
  { key: 'assign', icon: UserCheck },
  { key: 'start', icon: PlayCircle },
  { key: 'pick', icon: ClipboardList },
  { key: 'complete', icon: ClipboardList },
] as const;

/**
 * The requested "info icon": a Help explainer of the whole wave flow in
 * one visual unit — what each step means, who does it, and what happens
 * automatically. Rendered via DialogTrigger so any page drops it in.
 */
export function BatchHelpDialog() {
  const { t } = useTranslation();

  return (
    <Dialog>
      <DialogTrigger
        render={<Button type="button" variant="outline" size="icon-sm" aria-label={t('batches.howItWorks')} />}
      >
        <Info className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Waves className="h-5 w-5" />
            {t('batches.howItWorksTitle')}
          </DialogTitle>
          <DialogDescription>{t('batches.howItWorksDescription')}</DialogDescription>
        </DialogHeader>

        <ol className="space-y-3">
          {FLOW_STEPS.map(({ key, icon: Icon }, index) => (
            <li key={key} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {index + 1}. {t('batches.help.' + key + '.title')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('batches.help.' + key + '.body')}
                </p>
                <p className="mt-0.5 text-xs font-medium text-info">
                  {t('batches.help.' + key + '.who')}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {t('batches.helpNote')}
        </p>
      </DialogContent>
    </Dialog>
  );
}
