import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { createTestApp } from '@test/support/app';
import { createAdmin, findUserId } from '@test/support/admin';
import { getAdminAnalytics } from '@test/support/admin-analytics';
import { insertTickets, type TicketSeed } from '@test/support/admin-analytics-blocks';
import { ANALYTICS_PERIOD as PERIOD } from '@test/support/admin-analytics-plans';
import { registerUser, validRegistration } from '@test/support/auth';
import { resetTestData } from '@test/support/database';

const NOW = new Date('2026-10-08T12:00:00Z');

describe('Admin analytics support (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
    await resetTestData(db);
    admin = await createAdmin(app, db);
    await registerUser(app);
    const userId = await findUserId(db, validRegistration.email);
    const ticket = (seed: Omit<TicketSeed, 'userId'>): TicketSeed => ({ userId, ...seed });
    await insertTickets(db, [
      ticket({
        topic: 'payment',
        createdAt: '2026-10-02T09:00:00Z',
        respondedAfterMin: 10,
        closed: true,
      }),
      ticket({
        topic: 'payment',
        createdAt: '2026-10-02T10:00:00Z',
        respondedAfterMin: 20,
        closed: true,
      }),
      ticket({ topic: 'other', createdAt: '2026-10-02T11:00:00Z', respondedAfterMin: 40 }),
      ticket({
        topic: 'app',
        createdAt: '2026-10-04T09:00:00Z',
        respondedAfterMin: 5,
        closed: true,
      }),
      ticket({ topic: 'account', createdAt: '2026-10-04T10:00:00Z', respondedAfterMin: 15 }),
      ticket({ topic: 'other', createdAt: '2026-10-04T09:00:00Z' }),
      ticket({
        topic: 'payment',
        createdAt: '2026-09-26T09:00:00Z',
        respondedAfterMin: 30,
        closed: true,
      }),
      ticket({ topic: 'app', createdAt: '2026-09-27T09:00:00Z', closed: true }),
      ticket({ topic: 'account', createdAt: '2026-10-08T10:30:00Z' }),
    ]);
    jest.useFakeTimers({
      now: NOW,
      advanceTimers: true,
      doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'],
    });
  });

  afterAll(async () => {
    jest.useRealTimers();
    await app.close();
  });

  it('should count the KPIs of the period, the median and the tickets waiting now', async () => {
    const { body } = await getAdminAnalytics(app, admin, 'support', PERIOD).expect(HttpStatus.OK);

    expect(body.period).toEqual(PERIOD);
    expect(body.kpis).toEqual({
      ticketsCreated: { value: 6, previous: 2 },
      firstResponseMedianMinutes: { value: 15, previous: 30 },
      closed: { value: { closed: 3, total: 6 }, previous: { closed: 2, total: 2 } },
      unansweredNow: { count: 2, longestWaitMinutes: 5940 },
    });
  });

  it('should give every topic with zeros, by count, with other last', async () => {
    const { body } = await getAdminAnalytics(app, admin, 'support', PERIOD).expect(HttpStatus.OK);

    expect(body.topics).toEqual([
      { topic: 'payment', count: 2 },
      { topic: 'account', count: 1 },
      { topic: 'app', count: 1 },
      { topic: 'order_problem', count: 0 },
      { topic: 'client_unreachable', count: 0 },
      { topic: 'other', count: 2 },
    ]);
  });

  it('should give the median of odd and even days and null on empty days', async () => {
    const { body } = await getAdminAnalytics(app, admin, 'support', PERIOD).expect(HttpStatus.OK);

    expect(body.firstResponseByDay).toEqual([
      { date: '2026-10-01', medianMinutes: null, tickets: 0 },
      { date: '2026-10-02', medianMinutes: 20, tickets: 3 },
      { date: '2026-10-03', medianMinutes: null, tickets: 0 },
      { date: '2026-10-04', medianMinutes: 10, tickets: 3 },
      { date: '2026-10-05', medianMinutes: null, tickets: 0 },
      { date: '2026-10-06', medianMinutes: null, tickets: 0 },
      { date: '2026-10-07', medianMinutes: null, tickets: 0 },
    ]);
  });
});
