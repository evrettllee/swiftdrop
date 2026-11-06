import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { SUPPORT_TICKET_STATUS } from '@/common/enums/support-ticket.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders, supportTickets } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import {
  createManager,
  csvLines,
  getManagerCounts,
  getManagerExport,
  getManagerOrders,
  idsOf,
  insertOrderTicket,
  type ManagerListBody,
} from '@test/support/manager';
import { placeOrders, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

const OPEN_TICKET = { hasOpenTicket: 'true' };

describe('Manager orders with an open ticket (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let manager: string;
  let ids: number[];
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const client = await registerUser(app);
    ids = await placeOrders(app, client.cookies, 4);
    const [{ clientId }] = await db
      .select({ clientId: orders.clientId })
      .from(orders)
      .where(eq(orders.orderId, ids[0]));
    await setOrderStatus(db, ids[1], ORDER_STATUS.IN_TRANSIT);
    await setOrderStatus(db, ids[2], ORDER_STATUS.IN_TRANSIT);
    await insertOrderTicket(db, ids[0], clientId);
    await insertOrderTicket(db, ids[1], clientId);
    const closed = await insertOrderTicket(db, ids[2], clientId);
    await db
      .update(supportTickets)
      .set({ status: SUPPORT_TICKET_STATUS.CLOSED, closedAt: new Date() })
      .where(eq(supportTickets.ticketId, closed));
    manager = await createManager(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should keep only the orders with an open ticket and count them in the total', async () => {
    const body = (await getManagerOrders(app, manager, OPEN_TICKET).expect(HttpStatus.OK))
      .body as ManagerListBody;

    expect(idsOf(body).toSorted((a, b) => a - b)).toEqual([ids[0], ids[1]]);
    expect(body.total).toBe(2);
  });

  it('should add the filter to a tab', async () => {
    const body = (
      await getManagerOrders(app, manager, { ...OPEN_TICKET, status: 'active' }).expect(
        HttpStatus.OK,
      )
    ).body as ManagerListBody;

    expect(idsOf(body)).toEqual([ids[1]]);
    expect(body.total).toBe(1);
  });

  it('should count the tabs under the filter', async () => {
    const response = await getManagerCounts(app, manager, OPEN_TICKET).expect(HttpStatus.OK);

    expect(response.body).toEqual({
      attention: 0,
      active: 1,
      awaitingPayment: 1,
      finished: 0,
      cancelled: 0,
      all: 2,
    });
  });

  it('should export only the filtered orders', async () => {
    const response = await getManagerExport(app, manager, { format: 'csv', ...OPEN_TICKET }).expect(
      HttpStatus.OK,
    );
    const [, ...rows] = csvLines(response.body as Buffer);

    expect(rows.map((row) => Number(row[0])).toSorted((a, b) => a - b)).toEqual([ids[0], ids[1]]);
  });

  it.each([
    ['the list', getManagerOrders],
    ['the counts', getManagerCounts],
  ])('should refuse a flag other than true in %s', async (_name, request) => {
    await request(app, manager, { hasOpenTicket: 'false' }).expect(HttpStatus.BAD_REQUEST);
  });
});
