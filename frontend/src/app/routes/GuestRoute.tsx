import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router';
import { ROLE_HOME_ROUTE } from '@/shared/routes';
import { AUTH_STATUS, useAuthStore } from '@/shared/session';
import { PageLoader } from '@/shared/ui/page-loader';

// Pages for guests only (sign in, sign up): a signed-in user is sent to the home page of their
// role. Every way of signing in ends here: the email forms stay on this page, and the backend
// returns the user here after an OAuth provider.
export function GuestRoute() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  let content: ReactNode = <Outlet />;

  if (status === AUTH_STATUS.LOADING) {
    content = <PageLoader />;
  } else if (status === AUTH_STATUS.AUTHENTICATED && user !== null) {
    content = <Navigate to={ROLE_HOME_ROUTE[user.role]} replace />;
  }

  return content;
}
