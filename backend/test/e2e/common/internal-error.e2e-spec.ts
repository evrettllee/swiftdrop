import { NotFoundException, HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { INTERNAL_ERROR_MESSAGE } from '../../../src/common/constants/http.constants';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { OrdersQueryService } from '../../../src/modules/orders/services/orders-query.service';
import { ORDER_NOT_FOUND_MESSAGE } from '../../../src/common/constants/orders.constants';
import { ORDERS_ROUTES } from '../../../src/modules/orders/constants/orders.constants';
import { createTestApp } from '../../support/app';
import { COOKIE_HEADER, registerUser } from '../../support/auth';
import { resetTestData } from '../../support/database';
import { postApi } from '../../support/http';
import { getOrders } from '../../support/orders';

const MALFORMED_JSON = '{"pickup":';
// What an unexpected failure may carry: SQL with a column name, a file path of the server.
const INTERNAL_SQL = 'select "password_hash" from "users" where "user_id" = $1';
const INTERNAL_PATH = '/srv/swiftdrop/node_modules/pg/lib/client.js';
const LEAK_MARKERS = [INTERNAL_SQL, 'password_hash', INTERNAL_PATH, 'node_modules', '    at '];

describe('Unexpected server error (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  const list = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OrdersQueryService, useValue: { list } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    list.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should answer 500 without the stack, the SQL or the message of the error when a service fails', async () => {
    const failure = new Error(`${INTERNAL_SQL} failed`);
    failure.stack = `Error: ${INTERNAL_SQL}\n    at Client.query (${INTERNAL_PATH}:1:1)`;
    list.mockRejectedValue(failure);
    const { cookies } = await registerUser(app);

    const response = await getOrders(app, cookies).expect(HttpStatus.INTERNAL_SERVER_ERROR);
    const body = JSON.stringify(response.body);

    expect(response.body).toEqual({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: INTERNAL_ERROR_MESSAGE,
    });
    for (const marker of LEAK_MARKERS) {
      expect(body).not.toContain(marker);
    }
  });

  it('should keep the answer of an HTTP error when a service throws one', async () => {
    list.mockRejectedValue(new NotFoundException(ORDER_NOT_FOUND_MESSAGE));
    const { cookies } = await registerUser(app);

    const response = await getOrders(app, cookies).expect(HttpStatus.NOT_FOUND);

    expect(response.body.message).toBe(ORDER_NOT_FOUND_MESSAGE);
  });

  it('should answer 400, not 500, when the body is not valid JSON', async () => {
    const { cookies } = await registerUser(app);

    await postApi(app, ORDERS_ROUTES.BASE)
      .set(COOKIE_HEADER, cookies)
      .set('Content-Type', 'application/json')
      .send(MALFORMED_JSON)
      .expect(HttpStatus.BAD_REQUEST);
  });
});
