import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Socket } from 'socket.io-client';
import { ORDER_STATUS } from '../../src/common/enums/order-status.enum';
import type { Database } from '../../src/database/database.module';
import type {
  OrderJoinAck,
  OrderJoinRejection,
} from '../../src/modules/couriers/types/couriers-socket.types';
import { addCourierSession } from './assignment';
import { assignOrder, CAR, COURIER_ACCOUNT } from './couriers';
import { MINSK_PICKUP } from './fixtures';
import { type Cookies, placeOrders, setOrderStatus } from './orders';
import { connectAppSocket } from './sockets';

export const ORDER_JOIN_OK: OrderJoinAck = { ok: true };

export function orderJoinRefusal(reason: OrderJoinRejection): OrderJoinAck {
  return { ok: false, reason };
}

// The sockets a test opened, closed together after it.
export class OpenSockets {
  private readonly sockets: Socket[] = [];

  async connect(baseUrl: string, cookies: string): Promise<Socket> {
    const socket = await connectAppSocket(baseUrl, cookies);
    this.sockets.push(socket);

    return socket;
  }

  closeAll(): void {
    this.sockets.splice(0).forEach((socket) => socket.close());
  }
}

// An order of the client that waits for a courier.
export async function placeConfirmedOrder(
  app: NestExpressApplication,
  db: Database,
  cookies: Cookies,
): Promise<number> {
  const [orderId] = await placeOrders(app, cookies, 1);
  await setOrderStatus(db, orderId, ORDER_STATUS.CONFIRMED);

  return orderId;
}

// A courier on shift who has the order now, with the session cookies of that courier.
export async function assignCourier(
  app: NestExpressApplication,
  db: Database,
  orderId: number,
  account = COURIER_ACCOUNT,
): Promise<{ cookies: string; courierProfileId: number }> {
  const courier = await addCourierSession(app, db, account, CAR, MINSK_PICKUP);
  await assignOrder(db, orderId, courier.courierProfileId, ORDER_STATUS.COURIER_ASSIGNED);

  return courier;
}
