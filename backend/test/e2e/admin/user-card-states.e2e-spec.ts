import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import { ROLE } from '@/common/enums/role.enum';
import { TOKEN_KIND } from '@/common/enums/token-kind.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { USER_NOT_FOUND_MESSAGE } from '@/modules/admin/constants/admin-users.constants';
import { createTestApp } from '@test/support/app';
import {
  createAdmin,
  findUserId,
  getAdminUser,
  insertAdminAction,
  insertUser,
} from '@test/support/admin';
import { resetTestData } from '@test/support/database';
import { createInvitedStaff, issueLink } from '@test/support/password-links';
import { ADMIN_ACCOUNT } from '@test/support/users';

const HISTORY_INSERTED = 25;
const HISTORY_SHOWN = 20;
const MINUTE_MS = 60_000;

describe('Admin user card states (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  let adminId: number;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    admin = await createAdmin(app, db);
    adminId = await findUserId(db, ADMIN_ACCOUNT.email);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should show the active invite when the staff member is invited', async () => {
    const invited = await createInvitedStaff(db, ROLE.COURIER);
    await issueLink(app, invited.userId, TOKEN_KIND.INVITE);

    const { body } = await getAdminUser(app, admin, invited.userId).expect(HttpStatus.OK);

    expect(body).toMatchObject({
      status: 'invited',
      login: { password: false },
      invite: { sentAt: expect.any(String), expiresAt: expect.any(String) },
      courier: { vehicleType: null, deliveredCount: 0, activeOrderId: null },
    });
  });

  it('should show the reason, the time and the admin of the latest block when the user is blocked', async () => {
    const userId = await insertUser(db, {
      role: ROLE.CLIENT,
      email: 'blocked@x.by',
      isBlocked: true,
    });
    await insertAdminAction(db, {
      actorId: adminId,
      targetUserId: userId,
      action: ADMIN_ACTION.USER_BLOCKED,
      details: { reason: 'Старая причина' },
      createdAt: new Date(Date.now() - MINUTE_MS),
    });
    await insertAdminAction(db, {
      actorId: adminId,
      targetUserId: userId,
      action: ADMIN_ACTION.USER_BLOCKED,
      details: { reason: 'Мошенничество' },
    });

    const { body } = await getAdminUser(app, admin, userId).expect(HttpStatus.OK);

    expect(body.status).toBe('blocked');
    expect(body.block).toEqual({
      reason: 'Мошенничество',
      at: expect.any(String),
      by: { firstName: ADMIN_ACCOUNT.firstName, lastName: ADMIN_ACCOUNT.lastName },
    });
  });

  it('should give the 20 newest actions newest first when the user has a long history', async () => {
    const userId = await insertUser(db, { role: ROLE.MANAGER, email: 'staff@x.by' });

    for (let index = 0; index < HISTORY_INSERTED; index += 1) {
      await insertAdminAction(db, {
        actorId: adminId,
        targetUserId: userId,
        action: ADMIN_ACTION.SESSIONS_ENDED,
        details: { index },
        createdAt: new Date(Date.UTC(2026, 0, 1) + index * MINUTE_MS),
      });
    }

    const { body } = await getAdminUser(app, admin, userId).expect(HttpStatus.OK);
    const times = body.history.map((entry: { at: string }) => entry.at);

    expect(body.history).toHaveLength(HISTORY_SHOWN);
    expect(times).toEqual(
      [...times].sort((first: string, second: string) => second.localeCompare(first)),
    );
    expect(times[0]).toBe(new Date(Date.UTC(2026, 0, 1) + 24 * MINUTE_MS).toISOString());
    expect(body.history[0]).toMatchObject({
      action: ADMIN_ACTION.SESSIONS_ENDED,
      actor: { firstName: ADMIN_ACCOUNT.firstName, lastName: ADMIN_ACCOUNT.lastName },
      details: {},
    });
  });

  it.each([
    ['an unknown id', () => Promise.resolve(999_999)],
    ['an admin', () => Promise.resolve(adminId)],
  ])('should answer 404 for %s', async (_case, idOf) => {
    const response = await getAdminUser(app, admin, await idOf()).expect(HttpStatus.NOT_FOUND);

    expect(response.body.message).toBe(USER_NOT_FOUND_MESSAGE);
  });
});
