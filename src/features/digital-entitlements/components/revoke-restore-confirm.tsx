import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import type { DigitalEntitlement } from '../types/digital-entitlement.types';

interface RevokeRestoreConfirmProps {
  mode: 'revoke' | 'restore';
  entitlement: DigitalEntitlement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

/**
 * Confirmation for revoke (destructive tone) and restore (default tone).
 * Both backend calls are idempotent (verified: replays answer the same 200),
 * so accidental double submissions are inherently safe.
 */
export function RevokeRestoreConfirm({
  mode,
  entitlement,
  open,
  onOpenChange,
  onConfirm,
  loading,
}: RevokeRestoreConfirmProps) {
  const { t } = useTranslation();
  const isRevoke = mode === 'revoke';

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      tone={isRevoke ? 'danger' : 'default'}
      confirmLabel={isRevoke ? t('entitlements.revokeAction') : t('entitlements.restoreAction')}
      title={t(isRevoke ? 'entitlements.revokeTitle' : 'entitlements.restoreTitle')}
      description={
        entitlement
          ? t(isRevoke ? 'entitlements.revokeWarning' : 'entitlements.restoreWarning', {
              name: entitlement.product?.name ?? entitlement.uuid,
              email: entitlement.user?.email ?? '—',
            })
          : ''
      }
      onConfirm={onConfirm}
      loading={loading}
    />
  );
}
