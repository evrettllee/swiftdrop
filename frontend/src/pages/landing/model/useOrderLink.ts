import { type OrderDraftData, saveOrderDraft } from '@/features/order-draft';
import { APP_ROUTES } from '@/shared/routes';
import { ROLE, useAuthStore } from '@/shared/session';

// An "order" button of the landing. A signed-in client goes straight to the order form. Anyone else
// goes where the button led before (the sign-in, or the sign-up for the call to action) with the
// checkout marked as pending: after the sign-in the app sends a client on to the order form and
// drops the draft for any other role.
export function useOrderLink(guestRoute: string = APP_ROUTES.AUTH) {
  const isClient = useAuthStore((state) => state.user?.role === ROLE.CLIENT);

  // A signed-in client waits for no sign-in, so the flag would only cause a second navigation.
  function startOrder(data?: OrderDraftData): void {
    saveOrderDraft(data, { pendingCheckout: !isClient });
  }

  return { to: isClient ? APP_ROUTES.ORDER_NEW : guestRoute, startOrder };
}
