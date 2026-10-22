import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_OFFER_STATUS } from '../../../src/common/enums/order-offer-status.enum';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import { MAX_OFFERS_PER_ORDER } from '../../../src/modules/assignment/constants/assignment.constants';
import { OrderDispatchService } from '../../../src/modules/assignment/services/order-dispatch.service';
import { UNPAID_ORDER_TTL_MS } from '../../../src/modules/orders/constants/orders.constants';
import { UnpaidOrdersService } from '../../../src/modules/orders/services/unpaid-orders.service';
import { PAYMENT_EVENT } from '../../../src/modules/payments/constants/payments.constants';
import { PaymentGateway } from '../../../src/modules/payments/contracts/payment-gateway.contract';
import { createTestApp } from '../../support/app';
import { insertBareCouriers, insertOffer } from '../../support/assignment';
import { registerUser } from '../../support/auth';
import { OpenSockets } from '../../support/chat';
import {
  type Cookies,
  cancelOrder,
  placeOrders,
  SECOND_CLIENT,
  setOrderStatus,
} from '../../support/orders';
import {
  CHECKOUT_SESSION,
  createGatewayMock,
  insertPayment,
  PAYMENT_REF,
  postWebhook,
  resetGatewayMock,
  WEBHOOK_SIGNATURE,
} from '../../support/payments';
import { resetServiceArea } from '../../support/pricing';
import { listenTestApp } from '../../support/sockets';
import { settle, watchOrderStatus } from '../../support/tracking';

// Moments after the unpaid order expired, so the job cancels it.
const AFTER_UNPAID_TTL_MS = UNPAID_ORDER_TTL_MS + 1000;

describe('Order status events of the client and the system (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let clientCookies: Cookies;
  let orderId: number;
  const sockets = new OpenSockets();
  const getRoute = jest.fn();
  const gateway = createGatewayMock();

  function statusEvent(status: string) {
    return { orderId, status, estimatedDeliveryAt: expect.any(String) };
  }

  beforeAll(async () => {
    app = await createTestApp([
      { token: OsrmService, useValue: { getRoute } },
      { token: PaymentGateway, useValue: gateway },
    ]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    resetGatewayMock(gateway);
    ({ cookies: clientCookies } = await registerUser(app));
    [orderId] = await placeOrders(app, clientCookies, 1);
  });

  afterEach(() => {
    sockets.closeAll();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should send confirmed when the payment webhook arrives', async () => {
    await insertPayment(db, orderId, { checkoutSessionId: CHECKOUT_SESSION.sessionId });
    gateway.parseWebhook.mockReturnValue({
      type: PAYMENT_EVENT.PAID,
      orderId,
      sessionId: CHECKOUT_SESSION.sessionId,
      paymentRef: PAYMENT_REF,
    });
    const client = await watchOrderStatus(sockets, baseUrl, clientCookies, orderId);

    await postWebhook(app, WEBHOOK_SIGNATURE).expect(HttpStatus.OK);

    await settle(client);
    expect(client.events).toEqual([statusEvent(ORDER_STATUS.CONFIRMED)]);
  });

  it('should send cancelled when the client cancels, and nothing to an outsider', async () => {
    const outsiderCookies = (await registerUser(app, SECOND_CLIENT)).cookies;
    const [outsiderOrderId] = await placeOrders(app, outsiderCookies, 1);
    const client = await watchOrderStatus(sockets, baseUrl, clientCookies, orderId);
    const outsider = await watchOrderStatus(sockets, baseUrl, outsiderCookies, outsiderOrderId);

    await cancelOrder(app, clientCookies, orderId).expect(HttpStatus.OK);

    await settle(client, outsider);
    expect(client.events).toEqual([statusEvent(ORDER_STATUS.CANCELLED)]);
    expect(outsider.events).toEqual([]);
  });

  it('should send nothing when the cancellation is refused with 409', async () => {
    await setOrderStatus(db, orderId, ORDER_STATUS.PICKED_UP);
    const client = await watchOrderStatus(sockets, baseUrl, clientCookies, orderId);

    await cancelOrder(app, clientCookies, orderId).expect(HttpStatus.CONFLICT);

    await settle(client);
    expect(client.events).toEqual([]);
  });

  it('should send cancelled when the job cancels an unpaid order', async () => {
    const client = await watchOrderStatus(sockets, baseUrl, clientCookies, orderId);

    await app.get(UnpaidOrdersService).cancelExpired(new Date(Date.now() + AFTER_UNPAID_TTL_MS));

    await settle(client);
    expect(client.events).toEqual([statusEvent(ORDER_STATUS.CANCELLED)]);
  });

  it('should send awaiting_manual_assignment when the offers run out', async () => {
    await setOrderStatus(db, orderId, ORDER_STATUS.CONFIRMED);
    const courierIds = await insertBareCouriers(db, MAX_OFFERS_PER_ORDER);
    await Promise.all(
      courierIds.map((courierId) =>
        insertOffer(db, orderId, courierId, { status: ORDER_OFFER_STATUS.DECLINED }),
      ),
    );
    const client = await watchOrderStatus(sockets, baseUrl, clientCookies, orderId);

    await app.get(OrderDispatchService).dispatch(orderId);

    await settle(client);
    expect(client.events).toEqual([statusEvent(ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT)]);
  });
});
