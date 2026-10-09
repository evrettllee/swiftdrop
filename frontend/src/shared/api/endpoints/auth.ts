export const AUTH_API_PATHS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  GOOGLE: '/auth/google',
  YANDEX: '/auth/yandex',
} as const;

// Session
export const REFRESH_PATH = AUTH_API_PATHS.REFRESH;
// A 401 on these paths is a real answer, not an expired session, so it is never retried.
export const NO_RETRY_PATHS: string[] = [
  AUTH_API_PATHS.LOGIN,
  AUTH_API_PATHS.REGISTER,
  AUTH_API_PATHS.REFRESH,
  AUTH_API_PATHS.LOGOUT,
];
