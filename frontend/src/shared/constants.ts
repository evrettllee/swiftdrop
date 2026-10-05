// API
export const API_BASE_PATH = '/api';
export const JSON_CONTENT_TYPE = 'application/json';

export const AUTH_API_PATHS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  GOOGLE: '/auth/google',
  YANDEX: '/auth/yandex',
} as const;

// Application routes
export const APP_ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  PROFILE: '/profile',
  FORGOT_PASSWORD: '/forgot-password',
  TERMS: '/terms',
  PRIVACY: '/privacy',
} as const;

// CSRF protection: must match the header the backend requires on unsafe methods.
export const CSRF_HEADER_NAME = 'X-Requested-With';
export const CSRF_HEADER_VALUE = 'swiftdrop';

// Session
export const REFRESH_PATH = AUTH_API_PATHS.REFRESH;
// A 401 on these paths is a real answer, not an expired session, so it is never retried.
export const NO_RETRY_PATHS: string[] = [
  AUTH_API_PATHS.LOGIN,
  AUTH_API_PATHS.REGISTER,
  AUTH_API_PATHS.REFRESH,
  AUTH_API_PATHS.LOGOUT,
];

// HTTP
export const HTTP_METHOD = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

export const HTTP_STATUS = {
  NO_CONTENT: 204,
  UNAUTHORIZED: 401,
  TOO_MANY_REQUESTS: 429,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const NETWORK_ERROR_STATUS = 0;

export const API_ERROR_MESSAGES = {
  NETWORK: 'Нет соединения с сервером. Проверьте интернет и повторите попытку',
  GENERIC: 'Не удалось выполнить запрос. Попробуйте ещё раз',
} as const;

// Shared interface texts
export const UI_TEXTS = {
  LOADING: 'Загрузка',
  SKIP_TO_CONTENT: 'Перейти к основному содержимому',
} as const;

// Icons: one set and one weight for the whole app, sizes from the design system, section 7.
export const ICON_WEIGHT = 'light' as const;
export const ICON_SIZE = {
  SMALL: 16,
  MEDIUM: 20,
  LARGE: 24,
  XLARGE: 32,
} as const;

// Parts of generated element ids (label, hint, error, tabs and panels are linked through them).
export const ID_PART = {
  HINT: 'hint',
  ERROR: 'error',
  TAB: 'tab',
  PANEL: 'panel',
  BUTTON: 'button',
} as const;

// The map and the address search are centered on Minsk: [latitude, longitude].
export const CITY_CENTER: [number, number] = [53.9006, 27.559];

export const ESCAPE_KEY = 'Escape';

// Form values are kept as strings, a checkbox is one of these two.
export const CHECKBOX_CHECKED_VALUE = 'true';
export const CHECKBOX_UNCHECKED_VALUE = '';
