import { z } from 'zod';
import {
  API_BASE_PATH,
  API_ERROR_MESSAGES,
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
  HTTP_METHOD,
  HTTP_STATUS,
  JSON_CONTENT_TYPE,
  NETWORK_ERROR_STATUS,
  NO_RETRY_PATHS,
  REFRESH_PATH,
} from '../constants';

export type FieldError = { field: string; message: string };

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldError[];

  constructor(status: number, message: string, fieldErrors: FieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

type RequestOptions = { method: string; body?: unknown };

const errorBodySchema = z.object({
  message: z.string().optional(),
  errors: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
});

let sessionExpiredHandler: (() => void) | null = null;
let refreshInFlight: Promise<boolean> | null = null;

// The auth store registers itself here, so this module never imports the store.
export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const hasBody = options.body !== undefined;
  const headers: Record<string, string> = { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE };

  if (hasBody) {
    headers['Content-Type'] = JSON_CONTENT_TYPE;
  }

  try {
    return await fetch(`${API_BASE_PATH}${path}`, {
      method: options.method,
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(NETWORK_ERROR_STATUS, API_ERROR_MESSAGES.NETWORK);
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  const parsed = errorBodySchema.safeParse(await readJson(response));
  const body = parsed.success ? parsed.data : undefined;

  return new ApiError(response.status, body?.message ?? API_ERROR_MESSAGES.GENERIC, body?.errors);
}

async function performRefresh(): Promise<boolean> {
  try {
    const response = await send(REFRESH_PATH, { method: HTTP_METHOD.POST });

    return response.ok;
  } catch {
    return false;
  } finally {
    refreshInFlight = null;
  }
}

// Concurrent callers share one refresh: the refresh token rotates, so a second parallel call
// would reuse a spent token and make the backend revoke every session of the user.
function refreshSession(): Promise<boolean> {
  refreshInFlight ??= performRefresh();

  return refreshInFlight;
}

async function retryAfterRefresh(
  path: string,
  options: RequestOptions,
  failed: Response,
): Promise<Response> {
  const isRefreshed = await refreshSession();
  const result = isRefreshed ? await send(path, options) : failed;

  if (!isRefreshed) {
    sessionExpiredHandler?.();
  }

  return result;
}

async function request(path: string, options: RequestOptions): Promise<unknown> {
  let response = await send(path, options);

  if (response.status === HTTP_STATUS.UNAUTHORIZED && !NO_RETRY_PATHS.includes(path)) {
    response = await retryAfterRefresh(path, options, response);
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  return response.status === HTTP_STATUS.NO_CONTENT ? undefined : readJson(response);
}

// Responses are returned as unknown: callers validate them with a zod schema.
export const http = {
  get: (path: string) => request(path, { method: HTTP_METHOD.GET }),
  post: (path: string, body?: unknown) => request(path, { method: HTTP_METHOD.POST, body }),
  put: (path: string, body?: unknown) => request(path, { method: HTTP_METHOD.PUT, body }),
  patch: (path: string, body?: unknown) => request(path, { method: HTTP_METHOD.PATCH, body }),
  delete: (path: string) => request(path, { method: HTTP_METHOD.DELETE }),
};
