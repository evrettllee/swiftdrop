import { API_BASE_PATH } from '@/shared/api';

// Under the API prefix, because the session cookies are only sent to /api.
export const SOCKET_PATH = `${API_BASE_PATH}/socket.io`;

// Must match the namespace of the courier gateway of the backend.
export const COURIERS_NAMESPACE = '/couriers';

// WebSocket from the first request, without the long-polling start.
export const SOCKET_TRANSPORTS = ['websocket'];

// The events socket.io itself emits on a socket.
export const SOCKET_EVENT = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
} as const;

// Why socket.io closed a connection (the `reason` of the disconnect event).
export const DISCONNECT_REASON = {
  // The backend closes the socket when the access token it was opened with expires.
  SERVER: 'io server disconnect',
} as const;

// Why the backend refused a handshake (the message of connect_error); must match the backend.
export const SOCKET_ERROR = {
  UNAUTHORIZED: 'unauthorized',
} as const;
