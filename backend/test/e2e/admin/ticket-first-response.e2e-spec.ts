import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { asc, eq } from 'drizzle-orm';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { messages, supportTickets } from '@/database/schema';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { resetTestData } from '@test/support/database';
import { createManager } from '@test/support/manager';
import { postStaffMessage, postTicket, postTicketMessage } from '@test/support/support-tickets';

describe('Support ticket first response (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let client: string;
  let manager: string;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
    await resetTestData(db);
    client = (await registerUser(app)).cookies;
    manager = await createManager(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  async function firstResponseOf(ticketId: number): Promise<Date | null> {
    const [ticket] = await db
      .select({ firstResponseAt: supportTickets.firstResponseAt })
      .from(supportTickets)
      .where(eq(supportTickets.ticketId, ticketId));

    return ticket.firstResponseAt;
  }

  async function sentAtOf(ticketId: number): Promise<Date[]> {
    const rows = await db
      .select({ sentAt: messages.sentAt })
      .from(messages)
      .where(eq(messages.ticketId, ticketId))
      .orderBy(asc(messages.messageId));

    return rows.map((row) => row.sentAt);
  }

  it('should set the first response by the first staff message only and keep it', async () => {
    const { body } = await postTicket(app, client, {
      topic: 'payment',
      message: 'Деньги списались дважды',
    }).expect(HttpStatus.CREATED);
    const ticketId = body.id as number;

    await postTicketMessage(app, client, ticketId, 'Есть новости?').expect(HttpStatus.CREATED);
    expect(await firstResponseOf(ticketId)).toBeNull();

    await postStaffMessage(app, manager, ticketId, 'Проверяем').expect(HttpStatus.CREATED);
    const staffSentAt = (await sentAtOf(ticketId))[2];
    expect(await firstResponseOf(ticketId)).toEqual(staffSentAt);

    await postTicketMessage(app, client, ticketId, 'Спасибо').expect(HttpStatus.CREATED);
    await postStaffMessage(app, manager, ticketId, 'Деньги вернули').expect(HttpStatus.CREATED);
    expect(await firstResponseOf(ticketId)).toEqual(staffSentAt);
  });
});
