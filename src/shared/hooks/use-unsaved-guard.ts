import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Scoped unsaved-changes guard for declarative routers.
 *
 * `beforeunload` protects refreshes and tab closes. `confirmLeave` is for the
 * in-app exits we control (Cancel button, back link). Sidebar links and the
 * browser back button cannot be intercepted without migrating to a data
 * router — callers should keep those paths in mind.
 */
export function useUnsavedGuard(dirty: boolean) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!dirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Required by some browsers to show the native confirmation.
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  /** Returns true when navigation should proceed. */
  const confirmLeave = useCallback(() => {
    if (!dirty) return true;
    return window.confirm(t('sections.unsavedChangesConfirm'));
  }, [dirty, t]);

  return { confirmLeave };
}
