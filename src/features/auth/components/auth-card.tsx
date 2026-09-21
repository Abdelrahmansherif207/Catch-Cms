import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Shared auth shell: brand canvas with a soft radial glow,
 * elevated card, logo tile, and centered heading block.
 */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  const { t } = useTranslation();
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,var(--brand-accent)_0%,transparent_70%)] opacity-25"
      />
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border bg-card p-8 shadow-pop sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/[0.07] p-2.5 ring-1 ring-border">
              <img src="/catch-logo.png" alt={t('sidebar.brand')} className="h-full w-auto rounded-lg object-contain" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-balance text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 max-w-xs text-[0.9375rem] leading-relaxed text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>

          {children}

          {footer && (
            <div className="mt-7 border-t pt-6 text-center">{footer}</div>
          )}
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {t('sidebar.brand')} — {t('sidebar.rightsReserved')}
        </p>
      </div>
    </div>
  );
}
