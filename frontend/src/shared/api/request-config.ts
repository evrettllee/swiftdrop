export const API_BASE_PATH = '/api';
export const JSON_CONTENT_TYPE = 'application/json';
export const CONTENT_TYPE_HEADER = 'Content-Type';

// CSRF protection: must match the header the backend requires on unsafe methods.
export const CSRF_HEADER_NAME = 'X-Requested-With';
export const CSRF_HEADER_VALUE = 'swiftdrop';

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
  TOO_MANY_REQUESTS: 429,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const NETWORK_ERROR_STATUS = 0;

export const API_ERROR_MESSAGES = {
  NETWORK: 'Нет соединения с сервером. Проверьте интернет и повторите попытку',
  GENERIC: 'Не удалось выполнить запрос. Попробуйте ещё раз',
} as const;
