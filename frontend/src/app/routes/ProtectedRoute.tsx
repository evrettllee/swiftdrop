import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router';
import { ForbiddenPage } from '@/pages/forbidden';
import { APP_ROUTES } from '@/shared/routes';
import { AUTH_STATUS, type Role, useAuthStore } from '@/shared/session';
import { PageLoader } from '@/shared/ui/page-loader';

type ProtectedRouteProps = {
  roles?: Role[];
};

// Lets only signed-in users in; with `roles` a user of another role gets the 403 page.
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  let content: ReactNode = <Outlet />;

  if (status === AUTH_STATUS.LOADING) {
    content = <PageLoader />;
  } else if (user === null) {
    content = <Navigate to={APP_ROUTES.AUTH} replace />;
  } else if (roles !== undefined && !roles.includes(user.role)) {
    content = <ForbiddenPage />;
  }

  return content;
}
