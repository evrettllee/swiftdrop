import { createBrowserRouter } from 'react-router';
import { AuthPage } from '../features/auth/pages/AuthPage';
import { LandingPage } from '../features/landing/pages/LandingPage';
import { APP_ROUTES } from '../shared/constants';
import { GuestRoute } from './GuestRoute';
import { PLACEHOLDER_TEXTS } from './constants';
import { ErrorPage } from './pages/ErrorPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    // A layout-less root: it only catches errors thrown while rendering any page below.
    errorElement: <ErrorPage />,
    children: [
      { path: APP_ROUTES.HOME, element: <LandingPage /> },
      { element: <GuestRoute />, children: [{ path: APP_ROUTES.AUTH, element: <AuthPage /> }] },
      {
        element: <ProtectedRoute />,
        children: [{ path: APP_ROUTES.PROFILE, element: <ProfilePage /> }],
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
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
