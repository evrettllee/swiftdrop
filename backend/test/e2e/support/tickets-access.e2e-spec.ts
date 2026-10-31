import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { SUPPORT_ROUTES } from '@/modules/support/constants/support.constants';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { createCourier } from '@test/support/couriers';
import { createManager } from '@test/support/manager';
import { SECOND_CLIENT } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import {
  getTicket,
  getTicketMessages,
  getTickets,
  postTicket,
  postTicketAction,
  postTicketMessage,
} from '@test/support/support-tickets';
import { ADMIN_ACCOUNT, createUserWithRole } from '@test/support/users';

const QUESTION = { topic: 'other', subject: 'Вопрос', message: 'Как оплатить?' };

describe('Support tickets access (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let client: string;
  let ticketId: number;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    client = (await registerUser(app)).cookies;
    ticketId = (await postTicket(app, client, QUESTION).expect(HttpStatus.CREATED)).body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should keep a manager and an admin out with 403 and a guest with 401', async () => {
    const manager = await createManager(app, db);
    const admin = await createUserWithRole(app, db, ADMIN_ACCOUNT, ROLE.ADMIN);

    for (const staff of [manager, admin]) {
      await getTickets(app, staff).expect(HttpStatus.FORBIDDEN);
      await getTicket(app, staff, ticketId).expect(HttpStatus.FORBIDDEN);
      await postTicket(app, staff, QUESTION).expect(HttpStatus.FORBIDDEN);
      await postTicketMessage(app, staff, ticketId, 'Ответ').expect(HttpStatus.FORBIDDEN);
    }

    await getTickets(app, null).expect(HttpStatus.UNAUTHORIZED);
    await postTicket(app, null, QUESTION).expect(HttpStatus.UNAUTHORIZED);
  });

  it('should answer 404 to every route of a foreign ticket', async () => {
    const other = (await registerUser(app, SECOND_CLIENT)).cookies;

    await getTicket(app, other, ticketId).expect(HttpStatus.NOT_FOUND);
    await getTicketMessages(app, other, ticketId).expect(HttpStatus.NOT_FOUND);
    await postTicketMessage(app, other, ticketId, 'Чужое').expect(HttpStatus.NOT_FOUND);
    await postTicketAction(app, other, SUPPORT_ROUTES.READ, ticketId).expect(HttpStatus.NOT_FOUND);
    await postTicketAction(app, other, SUPPORT_ROUTES.CLOSE, ticketId).expect(HttpStatus.NOT_FOUND);
    await getTicket(app, client, ticketId).expect(HttpStatus.OK);
  });

  it('should give each role its own topics', async () => {
    const courier = await createCourier(app, db);

    await postTicket(app, client, { topic: 'app', message: 'Не работает' }).expect(
      HttpStatus.BAD_REQUEST,
    );
    await postTicket(app, courier, { topic: 'payment', message: 'Не прошла' }).expect(
      HttpStatus.BAD_REQUEST,
    );
    await postTicket(app, courier, { topic: 'app', message: 'Не работает' }).expect(
      HttpStatus.CREATED,
    );
  });
});
