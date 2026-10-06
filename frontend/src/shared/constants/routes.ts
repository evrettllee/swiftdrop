export const APP_ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  PROFILE: '/profile',
  FORGOT_PASSWORD: '/forgot-password',
  TERMS: '/terms',
  PRIVACY: '/privacy',
} as const;

// The router pattern for every address that matches no page.
export const CATCH_ALL_ROUTE = '*';
