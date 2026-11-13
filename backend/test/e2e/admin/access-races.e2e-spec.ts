import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database, Transaction } from '@/database/database.module';
import { orders } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { ADMIN_ACCESS_MESSAGES } from '@/modules/admin/constants/admin-access.constants';
import { ADMIN_DELETE_MESSAGES } from '@/modules/admin/constants/admin-delete.constants';
import { createTestApp } from '@test/support/app';
import { createAdmin, findUserId } from '@test/support/admin';
import { deleteAdminUser, postBlock } from '@test/support/admin-access';
import { findActions } from '@test/support/admin-staff';
import { registerUser, validRegistration } from '@test/support/auth';
import { commitOnceBlocked } from '@test/support/locks';
import { placeOrders, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

describe('Admin block and delete against a new client order (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  let clientId: number;
  let finishedOrderId: number;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    admin = await createAdmin(app, db);
    [finishedOrderId] = await placeOrders(app, (await registerUser(app)).cookies, 1);
    await setOrderStatus(db, finishedOrderId, ORDER_STATUS.DELIVERED);
    clientId = await findUserId(db, validRegistration.email);
  });

  afterAll(async () => {
    await app.close();
  });

  async function placeOrderInFlight(tx: Transaction): Promise<void> {
    const [finished] = await db.select().from(orders).where(eq(orders.orderId, finishedOrderId));
    const { orderId: _orderId, createdAt: _createdAt, ...copy } = finished;

    await tx.insert(orders).values({
      ...copy,
      status: ORDER_STATUS.PENDING,
      finishedAt: null,
      statusChangedAt: new Date(),
    });
  }

  it.each([
    ['block', () => postBlock(app, admin, clientId), ADMIN_ACCESS_MESSAGES.BLOCK_ACTIVE_ORDER],
    ['delete', () => deleteAdminUser(app, admin, clientId), ADMIN_DELETE_MESSAGES.ACTIVE_ORDER],
  ])(
    'should wait for an order being placed and refuse the %s once it is committed',
    async (_action, request, message) => {
      const response = await commitOnceBlocked(db, placeOrderInFlight, request);

      expect(response.status).toBe(HttpStatus.CONFLICT);
      expect(response.body.message).toBe(message);
      expect(await findActions(db, clientId)).toHaveLength(0);
    },
  );
});
