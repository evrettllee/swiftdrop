import { expect, type Page, test } from '@playwright/test';
import { VEHICLE_TYPE } from '../src/shared/api/endpoints/courier';
import { CITY_CENTER } from '../src/shared/config/map';
import { COURIER_SOCKET_EVENTS } from '../src/shared/realtime/courier-events';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { ROLE } from '../src/shared/session/auth-user';
import { stubHistory } from './support/courier-history';
import { type OrderStubState, stubCourierOnOrder } from './support/courier-order';
import { stubCourierSocket, stubSession } from './support/stub-session';

// The position of a courier on the line goes to the backend from every page of the cabinet, not
// only from the work page. The session, the cabinet and the socket come from the stubs.
const [LATITUDE, LONGITUDE] = CITY_CENTER;
// An event of the /couriers namespace as it goes over the WebSocket, with an optional ack number.
const EVENT_PREFIX = '42/couriers,';
const LOCATION_EVENT = `["${COURIER_SOCKET_EVENTS.LOCATION_UPDATE}"`;

test.use({
  geolocation: { latitude: LATITUDE, longitude: LONGITUDE },
  permissions: ['geolocation'],
});

// A courier with a vehicle and no order, on the line or off it, who opens the page at `path`.
async function openCabinet(page: Page, isAvailable: boolean, path: string) {
  const state: OrderStubState = {
    order: null,
    profile: {
      isAvailable,
      vehicle: { type: VEHICLE_TYPE.CAR, brand: null, model: null, licensePlate: null },
      activeOrderId: null,
    },
  };

  await stubSession(page, ROLE.COURIER);
  const socket = await stubCourierSocket(page);
  await stubCourierOnOrder(page, state);
  await stubHistory(page, []);
  await page.goto(path);

  return socket;
}

function hasSentPosition(socket: { sent: string[] }): boolean {
  return socket.sent.some(
    (frame) => frame.startsWith(EVENT_PREFIX) && frame.includes(LOCATION_EVENT),
  );
}

test('should send the position from the profile page while the courier is on the line', async ({
  page,
}) => {
  const socket = await openCabinet(page, true, APP_ROUTES.COURIER_PROFILE);

  await expect.poll(() => hasSentPosition(socket)).toBe(true);
});

test('should send no position from the history page while the courier is off the line', async ({
  page,
}) => {
  const socket = await openCabinet(page, false, APP_ROUTES.COURIER_HISTORY);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  expect(hasSentPosition(socket)).toBe(false);
});
