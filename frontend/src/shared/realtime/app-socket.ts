import { io, type Socket } from 'socket.io-client';
import { refreshSessionOrExpire } from '@/shared/api';
import { CONNECTION_STATUS, setConnectionStatus } from './connection-status';
import {
  APP_SOCKET_NAMESPACE,
  DISCONNECT_REASON,
  SOCKET_ERROR,
  SOCKET_EVENT,
  SOCKET_PATH,
  SOCKET_TRANSPORTS,
} from './socket-config';
import type { SocketEvent } from './socket-events';

// One connection per tab for both roles: the cabinet of the courier and the order page of the
// client own it; it is open while at least one of them is.
let socket: Socket | null = null;
let owners = 0;
// The backend refused the account (blocked): the socket stays closed until every owner has left.
let isRefused = false;
// The session is refreshed once per lost connection: a second refusal right after a refresh means
// the refresh does not help, so the socket gives up instead of refreshing in a loop.
let hasRefreshed = false;

// An owner is there and the account was not refused: a refresh that ends after the last owner left
// must not connect again.
function isWanted(): boolean {
  return owners > 0 && !isRefused;
}

// The access token in the cookie has expired: the socket is opened again with a fresh one. The
// order rooms of the socket are joined again on its next connect.
export async function reconnectWithFreshSession(current: Socket): Promise<void> {
  if (hasRefreshed) {
    setConnectionStatus(CONNECTION_STATUS.OFFLINE);

    return;
  }

  hasRefreshed = true;
  setConnectionStatus(CONNECTION_STATUS.RECONNECTING);

  // A failed refresh signs the user out, which closes the cabinet or the page and the socket.
  if ((await refreshSessionOrExpire()) && isWanted()) {
    current.connect();
  }
}

// The account was blocked: the backend closes the socket, and a refreshed session would not let it
// in again. It stays closed, even when a refresh started by the close of the backend ends later;
// the next request of the page signs the user out.
export function closeRefusedSocket(current: Socket): void {
  isRefused = true;
  current.disconnect();
  setConnectionStatus(CONNECTION_STATUS.OFFLINE);
}

function createSocket(): Socket {
  const created = io(APP_SOCKET_NAMESPACE, {
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

function getSocket(): Socket {
  socket ??= createSocket();

  return socket;
}

// The socket when it is connected now, for a message that needs a connection.
export function getConnectedSocket(): Socket | null {
  return socket?.connected === true ? socket : null;
}

// Adds an owner and opens the socket for the first one. The returned function removes the owner
// (a second call changes nothing); the last one to leave closes the socket.
export function connectAppSocket(): () => void {
  owners += 1;
  let isReleased = false;

  if (owners === 1) {
    isRefused = false;
    hasRefreshed = false;
  }

  const current = getSocket();

  if (!current.active && !isRefused) {
    setConnectionStatus(CONNECTION_STATUS.CONNECTING);
    current.connect();
  }

  return () => {
    if (isReleased) {
      return;
    }

    isReleased = true;
    owners -= 1;

    if (owners === 0) {
      current.disconnect();
      setConnectionStatus(CONNECTION_STATUS.OFFLINE);
    }
  };
}

// Calls `handler` with the payload of every `event` of the backend until the returned function is
// called; the payload is not checked here. Works before the first connection too.
export function onSocketEvent(event: SocketEvent, handler: (payload: unknown) => void): () => void {
  const current = getSocket();
  current.on(event, handler);

  return () => {
    current.off(event, handler);
  };
}

// Calls `handler` with the socket on every connection, the first one and each one after a loss.
export function onSocketConnect(handler: (connected: Socket) => void): () => void {
  const current = getSocket();
  const listener = () => handler(current);
  current.on(SOCKET_EVENT.CONNECT, listener);

  return () => {
    current.off(SOCKET_EVENT.CONNECT, listener);
  };
}
