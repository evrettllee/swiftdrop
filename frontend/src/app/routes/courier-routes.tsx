import { lazy } from 'react';
import type { RouteObject } from 'react-router';
import { APP_ROUTES } from '@/shared/routes';
import { ROLE } from '@/shared/session';
import { ProtectedRoute } from './ProtectedRoute';

// The pages of the courier, lazy like every page of the router.
export const courierRoutes: RouteObject = {
  // The cabinet of the courier: its layout holds the socket while any of its pages is open.
  element: <ProtectedRoute roles={[ROLE.COURIER]} />,
  children: [
    {
      // Lazy as well: the socket client is loaded only by couriers.
      Component: lazy(() =>
        import('../layouts/courier-layout/CourierLayout').then((module) => ({
          default: module.CourierLayout,
        })),
      ),
      children: [
        {
          path: APP_ROUTES.COURIER_WORK,
          Component: lazy(() =>
            import('@/pages/courier-work').then((module) => ({
              default: module.CourierWorkPage,
            })),
          ),
        },
        {
          path: APP_ROUTES.COURIER_HISTORY,
          Component: lazy(() =>
            import('@/pages/courier-history').then((module) => ({
              default: module.CourierHistoryPage,
            })),
          ),
        },
        {
          path: APP_ROUTES.COURIER_HISTORY_ORDER,
          Component: lazy(() =>
            import('@/pages/courier-history-order').then((module) => ({
              default: module.HistoryOrderPage,
            })),
          ),
        },
        {
          path: APP_ROUTES.COURIER_VEHICLE,
          Component: lazy(() =>
            import('@/pages/courier-vehicle').then((module) => ({
              default: module.CourierVehiclePage,
            })),
          ),
        },
        {
          path: APP_ROUTES.COURIER_PROFILE,
          // The same page as the client's: it knows nothing about the role.
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
