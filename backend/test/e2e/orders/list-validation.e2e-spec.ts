import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { LIST_VALIDATION_MESSAGES } from '@/common/constants/list.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import {
  ORDERS_PAGE_SIZE_MAX,
  ORDERS_ROUTES,
  ORDERS_VALIDATION_MESSAGES,
} from '@/modules/orders/constants/orders.constants';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { getApi } from '@test/support/http';
import { getOrders } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

describe('Orders list (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 400 with a field error when the page size is above the maximum', async () => {
    const { cookies } = await registerUser(app);

    const response = await getOrders(app, cookies, { limit: ORDERS_PAGE_SIZE_MAX + 1 }).expect(
      HttpStatus.BAD_REQUEST,
    );

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'limit',
          message: ORDERS_VALIDATION_MESSAGES.LIMIT_INVALID,
        }),
      ]),
    );
  });

  it('should return 400 for the filter of the old list', async () => {
    const { cookies } = await registerUser(app);

    const response = await getOrders(app, cookies, { filter: 'active' }).expect(
      HttpStatus.BAD_REQUEST,
    );

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: `${LIST_VALIDATION_MESSAGES.UNKNOWN_PARAMETER}: filter`,
        }),
      ]),
    );
  });

  it.each(['', '   '])('should return 400 for the search %j', async (q) => {
    const { cookies } = await registerUser(app);

    const response = await getOrders(app, cookies, { q }).expect(HttpStatus.BAD_REQUEST);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'q', message: LIST_VALIDATION_MESSAGES.SEARCH_INVALID }),
      ]),
    );
  });

  it('should return 401 when the request has no authentication', async () => {
    await getApi(app, ORDERS_ROUTES.BASE).expect(HttpStatus.UNAUTHORIZED);
  });
});
