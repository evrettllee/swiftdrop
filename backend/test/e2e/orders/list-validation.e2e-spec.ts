import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import {
  ORDERS_PAGE_SIZE_MAX,
  ORDERS_ROUTES,
  ORDERS_VALIDATION_MESSAGES,
} from '../../../src/modules/orders/constants/orders.constants';
import { createTestApp } from '../../support/app';
import { registerUser } from '../../support/auth';
import { getApi } from '../../support/http';
import { getOrders } from '../../support/orders';
import { resetServiceArea } from '../../support/pricing';

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

  it('should return 400 with a field error when the filter is unknown', async () => {
    const { cookies } = await registerUser(app);

    const response = await getOrders(app, cookies, { filter: 'archived' }).expect(
      HttpStatus.BAD_REQUEST,
    );

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'filter',
          message: ORDERS_VALIDATION_MESSAGES.FILTER_INVALID,
        }),
      ]),
    );
  });

  it('should return 401 when the request has no authentication', async () => {
    await getApi(app, ORDERS_ROUTES.BASE).expect(HttpStatus.UNAUTHORIZED);
  });
});
