import { io, type Socket } from 'socket.io-client';
import { refreshSessionOrExpire } from '@/shared/api';
import type { GeoPoint } from '@/shared/lib/geo';
import { CONNECTION_STATUS, setConnectionStatus } from './connection-status';
import { COURIER_SOCKET_EVENTS, type CourierSocketEvent } from './courier-events';
import {
  LOCATION_ACK_TIMEOUT_MS,
  type LocationAck,
  locationAckSchema,
  LOCATION_UPDATE_REJECTION,
  type LocationUpdateRejection,
} from './location-update';
import {
  COURIERS_NAMESPACE,
  DISCONNECT_REASON,
  SOCKET_ERROR,
  SOCKET_EVENT,
  SOCKET_PATH,
  SOCKET_TRANSPORTS,
} from './socket-config';

// One connection per tab, created on the first opening of the cabinet.
let socket: Socket | null = null;
// The cabinet is open: a refresh that ends after it was left must not connect again.
let isWanted = false;
// The session is refreshed once per lost connection: a second refusal right after a refresh means
// the refresh does not help, so the socket gives up instead of refreshing in a loop.
let hasRefreshed = false;

// The access token in the cookie has expired: the socket is opened again with a fresh one.
async function reconnectWithFreshSession(current: Socket): Promise<void> {
  if (hasRefreshed) {
    setConnectionStatus(CONNECTION_STATUS.OFFLINE);

    return;
  }

  hasRefreshed = true;
  setConnectionStatus(CONNECTION_STATUS.RECONNECTING);

  // A failed refresh signs the user out, which closes the cabinet and the socket.
  if ((await refreshSessionOrExpire()) && isWanted) {
    current.connect();
  }
}

function createSocket(): Socket {
  const created = io(COURIERS_NAMESPACE, {
    path: SOCKET_PATH,
    transports: SOCKET_TRANSPORTS,
    withCredentials: true,
    autoConnect: false,
  });

  created.on(SOCKET_EVENT.CONNECT, () => {
    hasRefreshed = false;
    setConnectionStatus(CONNECTION_STATUS.CONNECTED);
  });

  // A lost network is socket.io's own business: it is `active` and reconnects by itself.
  created.on(SOCKET_EVENT.DISCONNECT, (reason) => {
    if (reason === DISCONNECT_REASON.SERVER) {
      void reconnectWithFreshSession(created);
    } else {
      setConnectionStatus(
        created.active ? CONNECTION_STATUS.RECONNECTING : CONNECTION_STATUS.OFFLINE,
      );
    }
  });

  // The backend refused the handshake when the socket is not `active` any more.
  created.on(SOCKET_EVENT.CONNECT_ERROR, (error) => {
    if (created.active) {
      setConnectionStatus(CONNECTION_STATUS.RECONNECTING);
    } else if (error.message === SOCKET_ERROR.UNAUTHORIZED) {
      void reconnectWithFreshSession(created);
    } else {
      setConnectionStatus(CONNECTION_STATUS.OFFLINE);
    }
  });

  return created;
}

// Opens the socket of the courier cabinet; a second call while it is open changes nothing.
export function connectCourierSocket(): void {
  isWanted = true;
  hasRefreshed = false;
  socket ??= createSocket();

  if (!socket.active) {
    setConnectionStatus(CONNECTION_STATUS.CONNECTING);
    socket.connect();
  }
}

export function disconnectCourierSocket(): void {
  isWanted = false;
  socket?.disconnect();
  setConnectionStatus(CONNECTION_STATUS.OFFLINE);
}

// Calls `handler` with the payload of every `event` of the backend until the returned function is
// called; the payload is not checked here. Works before the first connection too.
export function onCourierSocketEvent(
  event: CourierSocketEvent,
  handler: (payload: unknown) => void,
): () => void {
  socket ??= createSocket();
  const current = socket;
  current.on(event, handler);

  return () => {
    current.off(event, handler);
  };
}

// Sends a position of the courier and returns the acknowledgement of the backend, or null when the
// socket is not connected or no acknowledgement came in time.
export async function sendCourierLocation(point: GeoPoint): Promise<LocationAck | null> {
  const current = socket;
  let ack: LocationAck | null = null;

  if (current?.connected === true) {
    try {
      const answer: unknown = await current
        .timeout(LOCATION_ACK_TIMEOUT_MS)
        .emitWithAck(COURIER_SOCKET_EVENTS.LOCATION_UPDATE, point);
      ack = locationAckSchema.parse(answer);
    } catch {
      ack = null;
    }
  }

  if (current !== null && ack?.ok === false) {
    handleRefusal(current, ack.reason);
  }

  return ack;
}

function handleRefusal(current: Socket, reason: LocationUpdateRejection): void {
  if (reason === LOCATION_UPDATE_REJECTION.SESSION_EXPIRED) {
    // The access token of the socket has expired: the backend closes it at about the same moment,
    // and whichever comes first opens it again with a refreshed session.
    current.disconnect();
    void reconnectWithFreshSession(current);
  } else if (reason === LOCATION_UPDATE_REJECTION.UNAUTHORIZED) {
    // The account was blocked: the backend closes the socket after this answer, and a refreshed
    // session would not let it in again. It stays closed, even when a refresh started by the close
    // of the backend ends later; the next request of the page signs the user out.
    isWanted = false;
    current.disconnect();
    setConnectionStatus(CONNECTION_STATUS.OFFLINE);
  }
}
