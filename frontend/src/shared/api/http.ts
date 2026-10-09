import { z } from 'zod';
import { NO_RETRY_PATHS, REFRESH_PATH } from './endpoints/auth';
import {
  API_BASE_PATH,
  API_ERROR_MESSAGES,
  CONTENT_TYPE_HEADER,
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
  HTTP_METHOD,
  HTTP_STATUS,
  JSON_CONTENT_TYPE,
  NETWORK_ERROR_STATUS,
  REFRESH_LOCK_NAME,
} from './request-config';

const fieldErrorSchema = z.object({ field: z.string(), message: z.string() });

export type FieldError = z.infer<typeof fieldErrorSchema>;

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

// An ApiError already carries a text for the user; anything else gets the caller's fallback.
export function getApiErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

type RequestOptions = { method: string; body?: unknown };

const errorBodySchema = z.object({
  message: z.string().optional(),
  errors: z.array(fieldErrorSchema).optional(),
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
    headers[CONTENT_TYPE_HEADER] = JSON_CONTENT_TYPE;
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

// The tabs of one browser share the session cookies, so they refresh one at a time: a tab that waited
// for the lock sends the refresh cookie the tab before it has just rotated, not the spent one.
// Without the Web Locks API (an old browser) every tab refreshes on its own, as before.
function withRefreshLock(refresh: () => Promise<boolean>): Promise<boolean> {
  return 'locks' in navigator ? navigator.locks.request(REFRESH_LOCK_NAME, refresh) : refresh();
}

async function performRefresh(): Promise<boolean> {
  try {
    return await withRefreshLock(async () => {
      const response = await send(REFRESH_PATH, { method: HTTP_METHOD.POST });

      return response.ok;
    });
  } catch {
    return false;
  } finally {
    refreshInFlight = null;
  }
}

// Concurrent callers of one tab share one refresh: the refresh token rotates, so a second parallel
// call would reuse a spent token.
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
