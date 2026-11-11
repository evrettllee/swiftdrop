import type { Page } from '@playwright/test';
import { COURIERS_API_PATHS, VEHICLE_TYPE } from '../../src/shared/api/endpoints/courier';
import { ORDER_STATUS, type OrderStatus } from '../../src/shared/api/endpoints/order';
import { ROUTING_API_PATHS } from '../../src/shared/api/endpoints/routing';
import { API_BASE_PATH } from '../../src/shared/api/request-config';
import { SOCKET_EVENTS } from '../../src/shared/realtime/socket-events';
import { ROLE } from '../../src/shared/session/auth-user';
import { type AppSocketStub, stubOrderLive } from './app-socket';
import { stubHistory } from './courier-history';
import { buildTestOrder, type OrderStubState, stubCourierOnOrder } from './courier-order';
import { stubMapbox } from './mapbox';
import { PARCEL_SEGMENT, stubRouteLines } from './routing';
import { stubSession } from './stub-session';

export const ASSIGNED_ORDER_ID = 990551;

export type CourierCabinet = { socket: AppSocketStub; state: OrderStubState };

export async function openCourierCabinet(
  page: Page,
  path: string,
  activeOrder: OrderStatus | null = null,
): Promise<CourierCabinet> {
  const state: OrderStubState = {
    order: activeOrder === null ? null : buildTestOrder(ASSIGNED_ORDER_ID, activeOrder),
    profile: {
      isAvailable: true,
      vehicle: { type: VEHICLE_TYPE.BICYCLE, brand: null, model: null, licensePlate: null },
      activeOrderId: activeOrder === null ? null : ASSIGNED_ORDER_ID,
    },
  };

  await stubSession(page, ROLE.COURIER);
  const socket = await stubOrderLive(page);
  await stubMapbox(page);
  await stubRouteLines(page, ROUTING_API_PATHS.COURIER_ORDER, () => [PARCEL_SEGMENT]);
  await stubRouteLines(page, ROUTING_API_PATHS.OFFER, () => [PARCEL_SEGMENT]);
  await stubCourierOnOrder(page, state);
  await stubHistory(page, []);
  await page.route(`**${API_BASE_PATH}${COURIERS_API_PATHS.STATS_TODAY}`, (route) =>
    route.fulfill({
      json: { delivered: 0, distanceKm: 0, offersReceived: 0, offersAccepted: 0, rating: null },
    }),
  );
  await page.goto(path);

  return { socket, state };
}

export function giveOrder(state: OrderStubState): void {
  state.order = buildTestOrder(ASSIGNED_ORDER_ID, ORDER_STATUS.COURIER_ASSIGNED);
  state.profile = { ...state.profile, activeOrderId: ASSIGNED_ORDER_ID };
}

export function assignOrder({ socket, state }: CourierCabinet): void {
  giveOrder(state);
  socket.push(SOCKET_EVENTS.ORDER_ASSIGNED, { orderId: ASSIGNED_ORDER_ID });
}

export function unassignOrder({ socket, state }: CourierCabinet): void {
  state.order = null;
  state.profile = { ...state.profile, activeOrderId: null };
  socket.push(SOCKET_EVENTS.ORDER_UNASSIGNED, { orderId: ASSIGNED_ORDER_ID });
}
