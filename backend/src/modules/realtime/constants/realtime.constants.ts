import { GLOBAL_PREFIX } from '../../../common/constants/http.constants';

// Under the API prefix, because the session cookie is only sent to /api.
export const SOCKET_PATH = `/${GLOBAL_PREFIX}/socket.io`;

// Reasons a connection is refused: the client reads them from connect_error.message.
export const SOCKET_ERRORS = {
  UNAUTHORIZED: 'unauthorized',
  ORIGIN_NOT_ALLOWED: 'origin_not_allowed',
} as const;

// Session
// The longest delay setTimeout takes: a bigger one fires at once.
export const SET_TIMEOUT_MAX_MS = 2 ** 31 - 1;

// Cookie header
export const COOKIE_PAIR_SEPARATOR = ';';
export const COOKIE_NAME_VALUE_SEPARATOR = '=';
