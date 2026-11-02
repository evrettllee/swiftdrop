import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet } from 'react-router';
import { ErrorPage } from '@/pages/error';
import { NotFoundPage } from '@/pages/not-found';
import { PLACEHOLDER_TEXTS, PlaceholderPage } from '@/pages/placeholder';
import { APP_ROUTES, CATCH_ALL_ROUTE, ORDER_DETAILS_PATTERN } from '@/shared/routes';
import { ROLE } from '@/shared/session';
import { PageLoader } from '@/shared/ui/page-loader';
import { ClientLayout } from '../layouts/client-layout/ClientLayout';
import { courierRoutes } from './courier-routes';
import { GuestRoute } from './GuestRoute';
import { managerRoutes } from './manager-routes';
import { PendingCheckoutRoute } from './PendingCheckoutRoute';
import { ProtectedRoute } from './ProtectedRoute';

// Pages load on demand so that Leaflet and other page-only code stay out of the entry chunk.
// The lazy components are created inline: named ones here would break Fast Refresh for this module.
// Error pages stay eager: they must render even when a page chunk fails to load.
export const router = createBrowserRouter([
  {
    // A root without its own layout: it catches errors thrown while rendering any page below
    // and shows the loader while a lazy page chunk is being fetched.
    element: (
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        // After any sign-in a client who started an order on the landing goes to the order form.
        element: <PendingCheckoutRoute />,
        children: [
          {
            path: APP_ROUTES.HOME,
            Component: lazy(() =>
              import('@/pages/landing').then((module) => ({
                default: module.LandingPage,
              })),
            ),
          },
          {
            element: <GuestRoute />,
            children: [
              {
                path: APP_ROUTES.AUTH,
                Component: lazy(() =>
                  import('@/pages/auth').then((module) => ({
                    default: module.AuthPage,
                  })),
                ),
              },
            ],
          },
          {
            // The pages of the client share one layout with the menu.
            element: <ProtectedRoute roles={[ROLE.CLIENT]} />,
            children: [
              {
                element: <ClientLayout />,
                children: [
                  {
                    path: APP_ROUTES.ORDERS,
                    Component: lazy(() =>
                      import('@/pages/orders').then((module) => ({
                        default: module.OrdersPage,
                      })),
                    ),
                  },
                  {
                    path: ORDER_DETAILS_PATTERN,
                    Component: lazy(() =>
                      import('@/pages/order').then((module) => ({
                        default: module.OrderPage,
                      })),
                    ),
                  },
                  {
                    path: APP_ROUTES.ORDER_NEW,
                    Component: lazy(() =>
                      import('@/pages/checkout').then((module) => ({
                        default: module.CheckoutPage,
                      })),
                    ),
                  },
                  {
                    path: APP_ROUTES.ADDRESSES,
                    Component: lazy(() =>
                      import('@/pages/addresses').then((module) => ({
                        default: module.AddressesPage,
                      })),
                    ),
                  },
                  {
                    path: APP_ROUTES.PROFILE,
                    Component: lazy(() =>
                      import('@/pages/profile').then((module) => ({
                        default: module.ProfilePage,
                      })),
                    ),
                  },
                ],
              },
            ],
          },
          courierRoutes,
          managerRoutes,
          {
            path: APP_ROUTES.FORGOT_PASSWORD,
            element: <PlaceholderPage title={PLACEHOLDER_TEXTS.FORGOT_PASSWORD_TITLE} />,
          },
          {
            path: APP_ROUTES.TERMS,
            element: <PlaceholderPage title={PLACEHOLDER_TEXTS.TERMS_TITLE} />,
          },
          {
            path: APP_ROUTES.PRIVACY,
            element: <PlaceholderPage title={PLACEHOLDER_TEXTS.PRIVACY_TITLE} />,
          },
          { path: CATCH_ALL_ROUTE, element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
