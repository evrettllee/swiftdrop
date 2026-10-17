import type { Page, WebSocketRoute } from '@playwright/test';
import { AUTH_API_PATHS } from '../../src/shared/api/endpoints/auth';
import { API_BASE_PATH } from '../../src/shared/api/request-config';
import type { Role } from '../../src/shared/session/auth-user';

export const STUB_EMAIL = 'stub-session@example.com';
// The frames of the socket.io handshake over a WebSocket: the server opens the transport, then
// accepts the namespace the client asks for.
const ENGINE_OPEN = '0{"sid":"e2e","upgrades":[],"pingInterval":25000,"pingTimeout":20000}';
// An event of the /couriers namespace as it goes over the WebSocket.
const EVENT_PREFIX = '42/couriers,';
const NAMESPACE_CONNECT_PREFIX = '40/couriers';
const NAMESPACE_CONNECTED = '40/couriers,{"sid":"e2e-couriers"}';

// The cabinet opens a socket with the cookies of a real session, which a stubbed session does not
// have: the handshake is answered here, so the socket does not ask the session to be refreshed.
// Returns the frames the page has sent over the socket and a way to send it an event of the
// backend.
export type CourierSocketStub = {
  sent: string[];
  push: (event: string, payload: object) => void;
};

export async function stubCourierSocket(page: Page): Promise<CourierSocketStub> {
  let route: WebSocketRoute | null = null;
  const socket: CourierSocketStub = {
    sent: [],
    push: (event, payload) => route?.send(`${EVENT_PREFIX}${JSON.stringify([event, payload])}`),
  };

  await page.routeWebSocket(`**${API_BASE_PATH}/socket.io/**`, (opened) => {
    route = opened;
    opened.send(ENGINE_OPEN);
    opened.onMessage((message) => {
      if (typeof message !== 'string') {
        return;
      }

      socket.sent.push(message);

      if (message.startsWith(NAMESPACE_CONNECT_PREFIX)) {
        opened.send(NAMESPACE_CONNECTED);
      }
    });
  });

  return socket;
}

// The session of the page comes from the stub: no sign-in and no seeded account are needed.
export async function stubSession(page: Page, role: Role): Promise<void> {
  await page.route(`**${API_BASE_PATH}${AUTH_API_PATHS.ME}`, (route) =>
    route.fulfill({
      json: {
        userId: 990007,
        firstName: 'Анна',
        lastName: 'Тестова',
        email: STUB_EMAIL,
        phone: null,
        role,
      },
    }),
  );
}
