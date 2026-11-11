import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { COURIER_ORDERS_ROUTES } from '@/modules/deliveries/constants/deliveries.constants';
import { ORDERS_ROUTES } from '@/modules/orders/constants/orders.constants';
import { SUPPORT_ROUTES } from '@/modules/support/constants/support.constants';
import { createTestApp } from '@test/support/app';
import { addCourierSession } from '@test/support/assignment';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { getApi } from '@test/support/http';
import { createManager } from '@test/support/manager';
import { placeOrders } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { postStaffMessage, postTicket, postTicketAction } from '@test/support/support-tickets';

describe('Open ticket of an order (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let client: string;
  let courier: string;
  let staff: string;
  let orderId: number;
  const getRoute = jest.fn();

  function clientTicket() {
    return getApi(app, `${ORDERS_ROUTES.BASE}/${orderId}`)
      .set(COOKIE_HEADER, client)
      .expect(HttpStatus.OK)
      .then((response) => response.body.supportTicket);
  }

  function courierTicket() {
    return getApi(app, `${COURIER_ORDERS_ROUTES.BASE}/${COURIER_ORDERS_ROUTES.CURRENT}`)
      .set(COOKIE_HEADER, courier)
      .expect(HttpStatus.OK)
      .then((response) => response.body.order.supportTicket);
  }

  async function openTicket(cookies: string): Promise<number> {
    const response = await postTicket(app, cookies, {
      topic: 'order_problem',
      orderId,
      message: 'Курьер не может найти подъезд',
    }).expect(HttpStatus.CREATED);

    return response.body.id as number;
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    staff = await createManager(app, db);
    client = (await registerUser(app)).cookies;
    [orderId] = await placeOrders(app, client, 1);
    const session = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    courier = session.cookies;
    await assignOrder(db, orderId, session.courierProfileId, ORDER_STATUS.COURIER_ASSIGNED);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should give no ticket to the client and the courier when nobody wrote to the support', async () => {
    expect(await clientTicket()).toBeNull();
    expect(await courierTicket()).toBeNull();
  });

  it('should give the client the open ticket of the order with the unread replies of the staff', async () => {
    const ticketId = await openTicket(client);

    expect(await clientTicket()).toEqual({
      ticketId,
      status: 'open',
      awaitingStaff: true,
      unreadCount: 0,
      lastMessageAt: expect.any(String),
    });

    await postStaffMessage(app, staff, ticketId, 'Сейчас передам курьеру').expect(
      HttpStatus.CREATED,
    );

    expect(await clientTicket()).toMatchObject({ ticketId, awaitingStaff: false, unreadCount: 1 });
  });

  it('should give no ticket after the ticket was closed', async () => {
    const ticketId = await openTicket(client);
    await postTicketAction(app, client, SUPPORT_ROUTES.CLOSE, ticketId).expect(HttpStatus.OK);

    expect(await clientTicket()).toBeNull();
  });

  it('should give the courier only the own ticket of the current order', async () => {
    const clientTicketId = await openTicket(client);

    expect(await courierTicket()).toBeNull();

    const courierTicketId = await openTicket(courier);

    expect(await courierTicket()).toMatchObject({ ticketId: courierTicketId, status: 'open' });
    expect(await clientTicket()).toMatchObject({ ticketId: clientTicketId });
  });
});
