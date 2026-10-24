import type { Page, WebSocketRoute } from '@playwright/test';
import { API_BASE_PATH } from '../../src/shared/api/request-config';
import { SOCKET_EVENTS } from '../../src/shared/realtime/socket-events';

// The frames of the socket.io handshake over a WebSocket: the server opens the transport, then
// accepts the namespace the client asks for.
const ENGINE_OPEN = '0{"sid":"e2e","upgrades":[],"pingInterval":25000,"pingTimeout":20000}';
const NAMESPACE_CONNECT_PREFIX = '40/couriers';
const NAMESPACE_CONNECTED = '40/couriers,{"sid":"e2e-couriers"}';
// An event of the /couriers namespace: "42/couriers," and the JSON of [event, payload]. One that
// waits for an acknowledgement has its id before the JSON, and the answer is "43/couriers,<id>[...]".
const EVENT_PREFIX = '42/couriers,';
const ACK_PREFIX = '43/couriers,';
const EVENT_WITH_ACK = /^42\/couriers,(\d+)(\[.*\])$/s;

export type OrderJoinAnswer = { ok: true } | { ok: false; reason: string };

export type AppSocketStub = {
  // Every frame the page sent, on every connection.
  sent: string[];
  // The orders the page asked to join, in the order of the requests, after reconnections too.
  joins: number[];
  // When each join was answered, by the clock of the test.
  joinedAt: number[];
  // Sends an event of the backend to the page.
  push: (event: string, payload: object) => void;
  // Closes the connection as a lost network does: socket.io opens it again by itself.
  drop: () => Promise<void>;
};

type AppSocketOptions = {
  // The answer of the backend to order:join; every room is joined by default.
  answerJoin?: (orderId: number) => OrderJoinAnswer;
};

function readEventWithAck(
  frame: string,
): { ackId: string; event: string; payload: unknown } | null {
  const match = EVENT_WITH_ACK.exec(frame);

  if (match === null) {
    return null;
  }

  const [event, payload] = JSON.parse(match[2]) as [string, unknown];

  return { ackId: match[1], event, payload };
}

// The page opens the app socket with the cookies of a real session, which a stubbed session does
// not have: the backend is replaced here, so the socket does not ask the session to be refreshed.
export async function stubAppSocket(
  page: Page,
  { answerJoin = () => ({ ok: true }) }: AppSocketOptions = {},
): Promise<AppSocketStub> {
  let route: WebSocketRoute | null = null;
  const socket: AppSocketStub = {
    sent: [],
    joins: [],
    joinedAt: [],
    push: (event, payload) => route?.send(`${EVENT_PREFIX}${JSON.stringify([event, payload])}`),
    drop: async () => route?.close(),
  };

  await page.routeWebSocket(`**${API_BASE_PATH}/socket.io/**`, (opened) => {
    route = opened;
    opened.send(ENGINE_OPEN);
    opened.onMessage((message) => {
      if (typeof message !== 'string') {
        return;
      }

      socket.sent.push(message);
      const withAck = readEventWithAck(message);

      if (message.startsWith(NAMESPACE_CONNECT_PREFIX)) {
        opened.send(NAMESPACE_CONNECTED);
      } else if (withAck?.event === SOCKET_EVENTS.ORDER_JOIN) {
        const { orderId } = withAck.payload as { orderId: number };
        socket.joins.push(orderId);
        socket.joinedAt.push(Date.now());
        opened.send(`${ACK_PREFIX}${withAck.ackId}${JSON.stringify([answerJoin(orderId)])}`);
      }
    });
  });

  return socket;
}

// The chat of every order is empty: a stubbed session cannot read it from the backend.
export async function stubOrderChats(page: Page): Promise<void> {
  await page.route(/\/api\/orders\/\d+\/messages(\?.*)?$/, (route) =>
    route.fulfill({ json: { items: [], nextBeforeId: null, unreadCount: 0, canSend: true } }),
  );
}

// The room of an order and its chat for a page of a stubbed session.
export async function stubOrderLive(
  page: Page,
  options: AppSocketOptions = {},
): Promise<AppSocketStub> {
  await stubOrderChats(page);

  return stubAppSocket(page, options);
}
