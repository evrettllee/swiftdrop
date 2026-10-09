import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router';
import { APP_ROUTES } from '@/shared/routes';
import { AUTH_STATUS, useAuthStore } from '@/shared/session';
import { PageLoader } from '@/shared/ui/page-loader';

// Pages for guests only (sign in, sign up): a signed-in user is sent home.
export function GuestRoute() {
  const status = useAuthStore((state) => state.status);
  let content: ReactNode = <Outlet />;

  if (status === AUTH_STATUS.LOADING) {
    content = <PageLoader />;
  } else if (status === AUTH_STATUS.AUTHENTICATED) {
    content = <Navigate to={APP_ROUTES.HOME} replace />;
  }

  return content;
}
