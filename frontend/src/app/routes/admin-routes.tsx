import { lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router';
import { APP_ROUTES } from '@/shared/routes';
import { ROLE } from '@/shared/session';
import { ProtectedRoute } from './ProtectedRoute';

export const adminRoutes: RouteObject = {
  element: <ProtectedRoute roles={[ROLE.ADMIN]} />,
  children: [
    {
      path: APP_ROUTES.ADMIN,
      element: <Navigate to={APP_ROUTES.ADMIN_USERS} replace />,
    },
    {
      Component: lazy(() =>
        import('../layouts/staff-layout/AdminLayout').then((module) => ({
          default: module.AdminLayout,
        })),
      ),
      children: [
        {
          path: APP_ROUTES.ADMIN_USERS,
          Component: lazy(() =>
            import('@/pages/admin/users').then((module) => ({
              default: module.AdminUsersPage,
            })),
          ),
        },
        {
          path: APP_ROUTES.ADMIN_USER,
          Component: lazy(() =>
            import('@/pages/admin/user-card').then((module) => ({
              default: module.AdminUserCardPage,
            })),
          ),
        },
        {
          path: APP_ROUTES.ADMIN_TARIFFS,
          Component: lazy(() =>
            import('@/pages/admin/tariffs').then((module) => ({
              default: module.AdminTariffsPage,
            })),
          ),
        },
        {
          path: APP_ROUTES.ADMIN_ANALYTICS,
          Component: lazy(() =>
            import('@/pages/admin/analytics').then((module) => ({
              default: module.AdminAnalyticsPage,
            })),
          ),
        },
        {
          path: APP_ROUTES.ADMIN_PROFILE,
          Component: lazy(() =>
            import('@/pages/profile').then((module) => ({
              default: module.ProfilePage,
            })),
          ),
        },
      ],
    },
  ],
};
