import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { MS_PER_MINUTE } from '../../../src/common/constants/time.constants';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { orders } from '../../../src/database/schema';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import {
  ORDER_CANCELLED_BY,
  ORDERS_ROUTES,
  UNPAID_ORDER_TTL_MS,
} from '../../../src/modules/orders/constants/orders.constants';
import { UnpaidOrdersService } from '../../../src/modules/orders/services/unpaid-orders.service';
import { PaymentGateway } from '../../../src/modules/payments/contracts/payment-gateway.contract';
import { createTestApp } from '../../support/app';
import { COOKIE_HEADER, registerUser } from '../../support/auth';
import { getApi } from '../../support/http';
import { cancelOrder, type Cookies, placeOrders } from '../../support/orders';
import { createGatewayMock, resetGatewayMock } from '../../support/payments';
import { resetServiceArea } from '../../support/pricing';

describe('Order details, who cancelled the order (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let cookies: Cookies;
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
    ({ cookies } = await registerUser(app));
    [orderId] = await placeOrders(app, cookies, 1);
  });

  afterAll(async () => {
    await app.close();
  });

  async function readOrder() {
    const response = await getApi(app, `${ORDERS_ROUTES.BASE}/${orderId}`)
      .set(COOKIE_HEADER, cookies)
      .expect(HttpStatus.OK);

    return response.body;
  }

  it('should say the system cancelled the order when it stayed unpaid for too long', async () => {
    const createdAt = new Date(Date.now() - UNPAID_ORDER_TTL_MS - MS_PER_MINUTE);
    await db.update(orders).set({ createdAt }).where(eq(orders.orderId, orderId));
    await app.get(UnpaidOrdersService).cancelExpired();

    expect((await readOrder()).cancelledBy).toBe(ORDER_CANCELLED_BY.SYSTEM);
  });

  it('should say the client cancelled the order when the client cancelled it', async () => {
    await cancelOrder(app, cookies, orderId).expect(HttpStatus.OK);

    expect((await readOrder()).cancelledBy).toBe(ORDER_CANCELLED_BY.CLIENT);
  });

  it('should give no author and no history authors when the order is not cancelled', async () => {
    const order = await readOrder();

    expect(order.cancelledBy).toBeNull();
    expect(Object.keys(order.history[0])).toEqual(['status', 'changedAt']);
  });
});
