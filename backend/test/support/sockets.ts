import type { AddressInfo } from 'node:net';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { io, type Socket } from 'socket.io-client';
import { COURIERS_SOCKET_NAMESPACE } from '../../src/modules/couriers/constants/couriers-socket.constants';
import { SOCKET_PATH } from '../../src/modules/realtime/constants/realtime.constants';
import { COOKIE_HEADER } from './auth';

const LOOPBACK_URL = 'http://127.0.0.1';
const ANY_FREE_PORT = 0;
const ORIGIN_HEADER = 'Origin';
const WEBSOCKET_TRANSPORT = 'websocket';
const CONNECT_EVENT = 'connect';
const CONNECT_ERROR_EVENT = 'connect_error';

// Sockets need a real port: supertest alone never opens one.
export async function listenTestApp(app: NestExpressApplication): Promise<string> {
  await app.listen(ANY_FREE_PORT);
  const { port } = app.getHttpServer().address() as AddressInfo;

  return `${LOOPBACK_URL}:${port}`;
}

// The page origin the browser would send: the app address from the test environment.
export function appOrigin(): string {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error('APP_URL is not set for the tests');
  }

  return new URL(appUrl).origin;
}

// Resolves with a connected socket, rejects with the server's reason when it refuses.
export function connectCourierSocket(
  baseUrl: string,
  cookies: string,
  origin = appOrigin(),
): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = io(`${baseUrl}${COURIERS_SOCKET_NAMESPACE}`, {
      path: SOCKET_PATH,
      transports: [WEBSOCKET_TRANSPORT],
      reconnection: false,
      extraHeaders: { [COOKIE_HEADER]: cookies, [ORIGIN_HEADER]: origin },
    });

    socket.once(CONNECT_EVENT, () => resolve(socket));
    socket.once(CONNECT_ERROR_EVENT, (error: Error) => {
      socket.close();
      reject(error);
    });
  });
}

const ACK_TIMEOUT_MS = 5000;

// Sends an event and waits for the server's acknowledgement.
export function emitWithAck<TAck>(socket: Socket, event: string, body: unknown): Promise<TAck> {
  return socket.timeout(ACK_TIMEOUT_MS).emitWithAck(event, body) as Promise<TAck>;
}
