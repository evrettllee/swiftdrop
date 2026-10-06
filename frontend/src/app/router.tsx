import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet } from 'react-router';
import { APP_ROUTES, CATCH_ALL_ROUTE } from '../shared/constants/routes';
import { PageLoader } from '../shared/ui/PageLoader';
import { GuestRoute } from './GuestRoute';
import { PLACEHOLDER_TEXTS } from './constants';
import { ErrorPage } from './pages/ErrorPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
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
        path: APP_ROUTES.HOME,
        Component: lazy(() =>
          import('../features/landing/pages/LandingPage').then((module) => ({
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
              import('../features/auth/pages/AuthPage').then((module) => ({
                default: module.AuthPage,
              })),
            ),
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: APP_ROUTES.PROFILE,
            Component: lazy(() =>
              import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })),
            ),
          },
        ],
      },
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
]);
