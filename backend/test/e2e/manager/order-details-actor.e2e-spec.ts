import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { ORDERS_ROUTES } from '@/modules/orders/constants/orders.constants';
import { PaymentGateway } from '@/modules/payments/contracts/payment-gateway.contract';
import { createTestApp } from '@test/support/app';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { getApi } from '@test/support/http';
import { createManager, getManagerOrder } from '@test/support/manager';
import { postManagerCancel } from '@test/support/manager-assignment';
import { type Cookies, placeOrders } from '@test/support/orders';
import { createGatewayMock, resetGatewayMock } from '@test/support/payments';
import { resetServiceArea } from '@test/support/pricing';
import { MANAGER_ACCOUNT } from '@test/support/users';

const REASON = 'Адрес доставки вне зоны';

describe('Manager order details: who changed the status (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let client: Cookies;
  let manager: string;
  let orderId: number;
  const getRoute = jest.fn();
  const gateway = createGatewayMock();

  beforeAll(async () => {
    app = await createTestApp([
      { token: OsrmService, useValue: { getRoute } },
      { token: PaymentGateway, useValue: gateway },
    ]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    resetGatewayMock(gateway);
    ({ cookies: client } = await registerUser(app));
    [orderId] = await placeOrders(app, client, 1);
    manager = await createManager(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should name the manager who changed the status as «Имя Ф.»', async () => {
    await postManagerCancel(app, manager, orderId, { reason: REASON }).expect(HttpStatus.OK);

    const response = await getManagerOrder(app, manager, orderId).expect(HttpStatus.OK);
    const { history } = response.body as { history: Record<string, unknown>[] };

    expect(history.at(-1)).toMatchObject({
      status: ORDER_STATUS.CANCELLED,
      actor: 'staff',
      actorName: `${MANAGER_ACCOUNT.firstName} ${MANAGER_ACCOUNT.lastName.charAt(0)}.`,
      comment: REASON,
    });
    expect(history.slice(0, -1).map((entry) => entry.actorName)).toEqual([null]);
    expect(JSON.stringify(history)).not.toContain(MANAGER_ACCOUNT.lastName);
  });

  it('should keep the name of the staff member away from the client', async () => {
    await postManagerCancel(app, manager, orderId, { reason: REASON }).expect(HttpStatus.OK);

    const response = await getApi(app, `${ORDERS_ROUTES.BASE}/${orderId}`)
      .set(COOKIE_HEADER, client)
      .expect(HttpStatus.OK);

    expect(JSON.stringify(response.body)).not.toContain(MANAGER_ACCOUNT.firstName);
    expect(response.body).not.toHaveProperty('actorName');
  });
});
