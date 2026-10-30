import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Socket } from 'socket.io-client';
import { ROLE } from '@/common/enums/role.enum';
import { TICKET_TOPIC } from '@/common/enums/support-ticket.enum';
import type { Database } from '@/database/database.module';
import { supportTickets } from '@/database/schema';
import { MANAGER_ORDERS_ROUTES } from '@/modules/manager/constants/manager-orders.constants';
import { ORDER_ID_ROUTE_PARAM } from '@/modules/orders/constants/orders.constants';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import type { StaffOrderEvent, StaffOrderEventKind } from '@/modules/realtime/types/realtime.types';
import { COOKIE_HEADER } from './auth';
import { getApi } from './http';
import { createUserWithRole, MANAGER_ACCOUNT } from './users';

export type ManagerListBody = {
  items: { id: number; status: string; statusChangedAt: string; paymentState: string }[];
  total?: number;
  until?: number | null;
  nextCursor?: string | null;
};

export function createManager(app: NestExpressApplication, db: Database): Promise<string> {
  return createUserWithRole(app, db, MANAGER_ACCOUNT, ROLE.MANAGER);
}

export function getManagerOrders(
  app: NestExpressApplication,
  cookies: string,
  query: Record<string, string | number> = {},
) {
  return getApi(app, MANAGER_ORDERS_ROUTES.BASE).set(COOKIE_HEADER, cookies).query(query);
}

export function getManagerCounts(
  app: NestExpressApplication,
  cookies: string,
  query: Record<string, string | number> = {},
) {
  return getApi(app, `${MANAGER_ORDERS_ROUTES.BASE}/${MANAGER_ORDERS_ROUTES.COUNTS}`)
    .set(COOKIE_HEADER, cookies)
    .query(query);
}

export function idsOf(body: ManagerListBody): number[] {
  return body.items.map((item) => item.id);
}

function managerOrderPath(route: string, orderId: number): string {
  return `${MANAGER_ORDERS_ROUTES.BASE}/${route.replace(ORDER_ID_ROUTE_PARAM, String(orderId))}`;
}

export function getManagerOrder(app: NestExpressApplication, cookies: string, orderId: number) {
  return getApi(app, managerOrderPath(MANAGER_ORDERS_ROUTES.DETAILS, orderId)).set(
    COOKIE_HEADER,
    cookies,
  );
}

export function getManagerOrderRoute(
  app: NestExpressApplication,
  cookies: string,
  orderId: number,
) {
  return getApi(app, managerOrderPath(MANAGER_ORDERS_ROUTES.ROUTE, orderId)).set(
    COOKIE_HEADER,
    cookies,
  );
}

export async function insertOrderTicket(
  db: Database,
  orderId: number,
  userId: number,
): Promise<number> {
  const [ticket] = await db
    .insert(supportTickets)
    .values({ orderId, userId, topic: TICKET_TOPIC.ORDER_PROBLEM })
    .returning({ ticketId: supportTickets.ticketId });

  return ticket.ticketId;
}

const STAFF_ORDER_WAIT_MS = 5000;

export function waitForStaffOrder(
  socket: Socket,
  orderId: number,
  kind: StaffOrderEventKind,
): Promise<StaffOrderEvent> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(SOCKET_EVENTS.STAFF_ORDER, listener);
      reject(new Error(`No ${SOCKET_EVENTS.STAFF_ORDER} ${kind} of order ${orderId} came`));
    }, STAFF_ORDER_WAIT_MS);

    function listener(event: StaffOrderEvent): void {
      if (event.orderId === orderId && event.kind === kind) {
        clearTimeout(timer);
        socket.off(SOCKET_EVENTS.STAFF_ORDER, listener);
        resolve(event);
      }
    }

    socket.on(SOCKET_EVENTS.STAFF_ORDER, listener);
  });
}
