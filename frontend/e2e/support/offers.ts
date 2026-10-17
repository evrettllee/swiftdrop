import type { Page, WebSocketRoute } from '@playwright/test';
import {
  COURIER_OFFERS_API_PATHS,
  type CourierOffer,
} from '../../src/shared/api/endpoints/courier-offer';
import { API_BASE_PATH } from '../../src/shared/api/request-config';
import { OFFER_TTL_MS } from '../../src/features/order-offer/config/offer';
import { TEST_ADDRESSES } from './mapbox';

const CITY = 'Минск';
const SOCKET_URL = `**${API_BASE_PATH}/socket.io/**`;
// A socket.io event of the /couriers namespace, as it goes over the WebSocket.
const COURIERS_EVENT_PREFIX = '42/couriers,';

// An offer of the test addresses, with the whole time to answer left.
export function buildTestOffer(offerId: number): CourierOffer {
  const { SVERDLOVA, PRITYTSKOGO } = TEST_ADDRESSES;

  return {
    offerId,
    orderId: offerId,
    expiresAt: new Date(Date.now() + OFFER_TTL_MS),
    pickupEtaSec: 401,
    totalEtaSec: 1801,
    pickup: { ...SVERDLOVA, city: CITY, apartment: null },
    delivery: { street: PRITYTSKOGO.street, city: CITY, latitude: 53.91, longitude: 27.46 },
    parcel: { weightKg: 2.5, lengthCm: 40, widthCm: 30, heightCm: 20, isFragile: true },
  };
}

// The backend answers that this offer is open.
export async function stubCurrentOffer(page: Page, offer: CourierOffer): Promise<void> {
  await page.route(`**${API_BASE_PATH}${COURIER_OFFERS_API_PATHS.CURRENT}`, (route) =>
    route.fulfill({ json: { offer } }),
  );
}

// The backend answers an answer to the offer with this status and no dispatcher behind it.
export async function stubOfferAnswer(
  page: Page,
  path: string,
  status: number,
  body?: object,
): Promise<void> {
  await page.route(`**${API_BASE_PATH}${path}`, (route) => route.fulfill({ status, json: body }));
}

// Passes the socket of the cabinet through and gives the test a way to send events of the
// backend to the page.
export async function interceptCourierSocket(page: Page): Promise<() => WebSocketRoute | null> {
  let socket: WebSocketRoute | null = null;

  await page.routeWebSocket(SOCKET_URL, (route) => {
    route.connectToServer();
    socket = route;
  });

  return () => socket;
}

export function sendCourierEvent(socket: WebSocketRoute, event: string, payload: object): void {
  socket.send(`${COURIERS_EVENT_PREFIX}${JSON.stringify([event, payload])}`);
}
