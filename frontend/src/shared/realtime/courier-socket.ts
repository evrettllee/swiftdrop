import { io, type Socket } from 'socket.io-client';
import { refreshSessionOrExpire } from '@/shared/api';
import { CONNECTION_STATUS, setConnectionStatus } from './connection-status';
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
