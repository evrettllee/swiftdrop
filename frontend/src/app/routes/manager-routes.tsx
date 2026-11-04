import { lazy } from 'react';
import type { RouteObject } from 'react-router';
import { APP_ROUTES } from '@/shared/routes';
import { ROLE } from '@/shared/session';
import { ProtectedRoute } from './ProtectedRoute';

export const managerRoutes: RouteObject = {
  element: <ProtectedRoute roles={[ROLE.MANAGER, ROLE.ADMIN]} />,
  children: [
    {
      Component: lazy(() =>
        import('../layouts/manager-layout/ManagerLayout').then((module) => ({
          default: module.ManagerLayout,
        })),
      ),
      children: [
        {
          path: APP_ROUTES.MANAGER_ORDERS,
          Component: lazy(() =>
            import('@/pages/manager/orders').then((module) => ({
              default: module.ManagerOrdersPage,
            })),
          ),
        },
        {
          path: APP_ROUTES.MANAGER_ORDER,
          Component: lazy(() =>
            import('@/pages/manager/order').then((module) => ({
              default: module.ManagerOrderPage,
            })),
          ),
        },
        {
          path: APP_ROUTES.MANAGER_MAP,
          Component: lazy(() =>
            import('@/pages/manager/map').then((module) => ({
              default: module.ManagerMapPage,
            })),
          ),
        },
        {
          path: APP_ROUTES.MANAGER_SUPPORT,
          Component: lazy(() =>
            import('@/pages/manager/support').then((module) => ({
              default: module.ManagerSupportPage,
            })),
          ),
        },
        {
          path: APP_ROUTES.MANAGER_ZONES_PAGE,
          Component: lazy(() =>
            import('@/pages/manager/zones').then((module) => ({
              default: module.ManagerZonesPage,
            })),
          ),
        },
        {
          path: APP_ROUTES.MANAGER_ZONE_NEW,
          Component: lazy(() =>
            import('@/pages/manager/zone-new').then((module) => ({
              default: module.ManagerZoneNewPage,
            })),
          ),
        },
        {
          path: APP_ROUTES.MANAGER_ZONE_CONTOUR,
          Component: lazy(() =>
            import('@/pages/manager/zone-contour').then((module) => ({
              default: module.ManagerZoneContourPage,
            })),
          ),
        },
        {
          path: APP_ROUTES.MANAGER_ANALYTICS,
          Component: lazy(() =>
            import('@/pages/manager/analytics').then((module) => ({
              default: module.ManagerAnalyticsPage,
            })),
          ),
        },
        {
          path: APP_ROUTES.MANAGER_ANALYTICS_COURIERS,
          Component: lazy(() =>
            import('@/pages/manager/analytics').then((module) => ({
              default: module.ManagerAnalyticsCouriersPage,
            })),
          ),
        },
        {
          path: APP_ROUTES.MANAGER_PROFILE,
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
