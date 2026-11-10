import { applyOrderDraftAccess, clearOrderDraft } from '@/features/order-draft';
import { useAuthStore } from '@/shared/session';
import { isSessionOwnerChanged } from './session-owner';

// The draft holds addresses and a recipient, so it belongs to whoever filled it in: it is dropped
// when the session ends (sign-out or an expired session) and when another account signs in.
// A guest who signs in is the same person, so the draft and its pending checkout are kept.
// The owner kept in the draft is checked on every change of the session, the end of the session
// check after a page load included, so a reload after an account change elsewhere is covered too.
export function bindOrderDraftToSession(): () => void {
  const unsubscribe = useAuthStore.subscribe((state, previous) => {
    if (isSessionOwnerChanged(previous, state)) {
      clearOrderDraft();
    }

    applyOrderDraftAccess();
  });

  // In case the session is known already; while it is restored this does nothing.
  applyOrderDraftAccess();

  return unsubscribe;
}
