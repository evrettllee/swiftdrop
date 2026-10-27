import type { Namespace, Socket } from 'socket.io';
import { SOCKET_ERRORS } from '../constants/realtime.constants';
import type { AppSocketData } from '../types/realtime.types';

// Runs the admission in the handshake, so a refused client never gets a connection at all. The
// reason of a refusal reaches the client in connect_error.message.
export function admitInHandshake(
  namespace: Namespace,
  admit: (socket: Socket) => Promise<AppSocketData>,
): void {
  namespace.use((socket, next) => {
    admit(socket).then(
      (data) => {
        socket.data = data;
        next();
      },
      (error: unknown) =>
        next(error instanceof Error ? error : new Error(SOCKET_ERRORS.UNAUTHORIZED)),
    );
  });
}
