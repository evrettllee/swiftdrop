import { type ReactNode, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { clearOrderDraft, clearPendingCheckout, usePendingCheckout } from '@/features/order-draft';
import { APP_ROUTES } from '@/shared/routes';
import { AUTH_STATUS, ROLE, useAuthStore } from '@/shared/session';
import { PageLoader } from '@/shared/ui/page-loader';

// The one place where every way of signing in ends when an "order" button of the landing started
// it: the email forms leave the user on the auth page, and the backend returns them there after an
// OAuth provider. It wraps every page and wins over the role home page of GuestRoute: a client with
// a pending checkout goes to the order form. Any other role keeps its usual way, and the draft is
// dropped. Without a pending checkout nothing changes.
export function PendingCheckoutRoute() {
  const isPending = usePendingCheckout();
  const status = useAuthStore((state) => state.status);
  const isClient = useAuthStore((state) => state.user?.role === ROLE.CLIENT);
  const { pathname } = useLocation();
  const isSignedIn = status === AUTH_STATUS.AUTHENTICATED;
  const isOnOrderForm = pathname === APP_ROUTES.ORDER_NEW;

  // The flag is cleared only once the order form is open: cleared earlier, it would let the page
  // under it (the auth page) send the user home while the redirect is still under way.
  useEffect(() => {
    if (isPending && isSignedIn) {
      if (!isClient) {
        clearOrderDraft();
      } else if (isOnOrderForm) {
        clearPendingCheckout();
      }
    }
  }, [isPending, isSignedIn, isClient, isOnOrderForm]);

  let content: ReactNode = <Outlet />;

  if (isPending && status === AUTH_STATUS.LOADING) {
    // The session is being restored (for example after the return from OAuth): the page under it
    // is not shown yet, so it does not flash before the redirect.
    content = <PageLoader />;
  } else if (isPending && isSignedIn && isClient && !isOnOrderForm) {
    content = <Navigate to={APP_ROUTES.ORDER_NEW} replace />;
  }

  return content;
}
