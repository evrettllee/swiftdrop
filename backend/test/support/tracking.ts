import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import type { Socket } from 'socket.io-client';
import { MS_PER_MINUTE } from '../../src/common/constants/time.constants';
import type { GeoPoint } from '../../src/common/schemas/geo-point.schema';
import type { Database } from '../../src/database/database.module';
import { courierProfiles } from '../../src/database/schema';
import { COURIER_SOCKET_EVENTS } from '../../src/modules/couriers/constants/couriers-socket.constants';
import type { LocationAck } from '../../src/modules/couriers/types/couriers-socket.types';
import { ORDER_ROOM_EVENTS } from '../../src/modules/tracking/constants/tracking.constants';
import type { OrderStatusEvent } from '../../src/modules/tracking/types/tracking.types';
import { assignCourier, type OpenSockets } from './chat';
import { placeCourierAt } from './couriers';
import { MINSK_DELIVERY, MINSK_PICKUP } from './fixtures';
import { collectEvents, emitWithAck, joinOrderRoom, roundTrip } from './sockets';

// Where the courier reports to be in the tests: away from the point they were put at.
export const REPORTED_POINT: GeoPoint = MINSK_DELIVERY;

export function sendLocation(
  socket: Socket,
  point: GeoPoint = REPORTED_POINT,
): Promise<LocationAck> {
  return emitWithAck<LocationAck>(socket, COURIER_SOCKET_EVENTS.LOCATION_UPDATE, point);
}

// The courier of the order, whose last position is old enough for the next one to be taken.
export async function assignTrackedCourier(
  app: NestExpressApplication,
  db: Database,
  orderId: number,
): Promise<{ cookies: string; courierProfileId: number }> {
  const courier = await assignCourier(app, db, orderId);
  await placeCourierAt(
    db,
    courier.courierProfileId,
    MINSK_PICKUP,
    new Date(Date.now() - MS_PER_MINUTE),
  );

  return courier;
}

// A socket in the room of the order and every order:status it gets from now on.
export async function watchOrderStatus(
  sockets: OpenSockets,
  baseUrl: string,
  cookies: string,
  orderId: number,
): Promise<{ socket: Socket; events: OrderStatusEvent[] }> {
  const socket = await sockets.connect(baseUrl, cookies);
  await joinOrderRoom(socket, { orderId });

  return {
    socket,
    events: collectEvents<OrderStatusEvent>(socket, ORDER_ROOM_EVENTS.ORDER_STATUS),
  };
}

// The order:status events sent before this call have arrived by the time it resolves.
export async function settle(...watchers: { socket: Socket }[]): Promise<void> {
  await Promise.all(watchers.map(({ socket }) => roundTrip(socket)));
}

export async function readCourierProfile(db: Database, courierProfileId: number) {
  const [profile] = await db
    .select()
    .from(courierProfiles)
    .where(eq(courierProfiles.courierProfileId, courierProfileId));

  return profile;
}
