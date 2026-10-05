import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router';
import { AUTH_STATUS } from '../features/auth/constants';
import { useAuthStore } from '../features/auth/store';
import { APP_ROUTES } from '../shared/constants';
import { PageLoader } from '../shared/ui/PageLoader';

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
