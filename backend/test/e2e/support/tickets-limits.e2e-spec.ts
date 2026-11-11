import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { SECOND_CLIENT } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { postTicket, postTicketMessage } from '@test/support/support-tickets';

const question = (index: number) => ({
  topic: 'other',
  subject: `Вопрос ${index}`,
  message: 'Текст',
});

describe('Support ticket limits (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    await resetServiceArea(db, getRoute);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should take 5 new tickets an hour per user and messages 20 a minute', async () => {
    const client = (await registerUser(app)).cookies;
    const other = (await registerUser(app, SECOND_CLIENT)).cookies;
    const ids: number[] = [];

    for (let index = 0; index < 5; index += 1) {
      ids.push((await postTicket(app, client, question(index)).expect(HttpStatus.CREATED)).body.id);
    }

    await postTicket(app, client, question(5)).expect(HttpStatus.TOO_MANY_REQUESTS);
    await postTicket(app, other, question(6)).expect(HttpStatus.CREATED);

    for (let index = 0; index < 20; index += 1) {
      await postTicketMessage(app, client, ids[0], `Сообщение ${index}`).expect(HttpStatus.CREATED);
    }

    await postTicketMessage(app, client, ids[0], 'Лишнее').expect(HttpStatus.TOO_MANY_REQUESTS);
  });
});
