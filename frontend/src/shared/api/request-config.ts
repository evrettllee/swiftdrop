export const API_BASE_PATH = '/api';
export const JSON_CONTENT_TYPE = 'application/json';
export const CONTENT_TYPE_HEADER = 'Content-Type';
// The session cookies go only to the backend of the same origin (the /api proxy).
export const REQUEST_CREDENTIALS: RequestCredentials = 'same-origin';

// CSRF protection: must match the header the backend requires on unsafe methods.
export const CSRF_HEADER_NAME = 'X-Requested-With';
export const CSRF_HEADER_VALUE = 'swiftdrop';

// The Web Lock that lets one tab of the browser refresh the session at a time.
export const REFRESH_LOCK_NAME = 'swiftdrop-session-refresh';

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
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const NETWORK_ERROR_STATUS = 0;

export const API_ERROR_MESSAGES = {
  NETWORK: 'Нет соединения с сервером. Проверьте интернет и повторите попытку',
  GENERIC: 'Не удалось выполнить запрос. Попробуйте ещё раз',
} as const;
