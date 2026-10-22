import { HttpStatus, Logger } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DrizzleQueryError } from 'drizzle-orm';
import { INTERNAL_ERROR_MESSAGE } from '../../../src/common/constants/http.constants';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import { createTestApp } from '../../support/app';
import { registerUser } from '../../support/auth';
import {
  assignCourier,
  countOrderMessages,
  placeConfirmedOrder,
  sendChatMessage,
} from '../../support/chat';
import { resetServiceArea } from '../../support/pricing';

const SECRET_TEXT = 'Код домофона 4821, ключ под ковриком';
const FAILED_INSERT = 'insert into "messages" ("sender_id", "receiver_id", "order_id", "content")';

describe('Chat message when the database fails (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    await resetServiceArea(db, getRoute);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  // The insert of the message fails as a lost connection would, with the text among its parameters.
  it('should answer 500 with the general text and keep the message out of the log', async () => {
    const { cookies } = await registerUser(app);
    const orderId = await placeConfirmedOrder(app, db, cookies);
    await assignCourier(app, db, orderId);
    const failure = new DrizzleQueryError(
      FAILED_INSERT,
      [1, 2, orderId, SECRET_TEXT],
      new Error('Connection terminated unexpectedly'),
    );
    const realTransaction = db.transaction.bind(db);
    jest.spyOn(db, 'transaction').mockImplementationOnce((work, config) =>
      realTransaction((tx) => {
        jest.spyOn(tx, 'insert').mockImplementation(() => {
          throw failure;
        });
        return work(tx);
      }, config),
    );
    const logged = jest.spyOn(Logger.prototype, 'error');

    const response = await sendChatMessage(app, cookies, orderId, { content: SECRET_TEXT }).expect(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );

    expect(response.body).toEqual({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: INTERNAL_ERROR_MESSAGE,
    });
    expect(logged).toHaveBeenCalled();
    expect(JSON.stringify(logged.mock.calls)).not.toContain(SECRET_TEXT);
    expect(JSON.stringify(response.body)).not.toContain(SECRET_TEXT);
    expect(await countOrderMessages(db, orderId)).toBe(0);
  });
});
