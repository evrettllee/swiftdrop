import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { users } from '@/database/schema';
import { ADMIN_STAFF_MESSAGES } from '@/modules/admin/constants/admin-staff.constants';
import { USERS_ERROR_MESSAGES } from '@/modules/users/constants/users.constants';
import { createTestApp } from '@test/support/app';
import { createAdmin, findUserId, insertUser } from '@test/support/admin';
import { findActions, patchAdminUser } from '@test/support/admin-staff';
import { resetTestData } from '@test/support/database';
import { ADMIN_ACCOUNT } from '@test/support/users';

const OLD_PHONE = '+375291110000';
const NEW_PHONE = '+375297770000';

describe('Admin staff update (e2e)', () => {
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

  function insertStaff(seed: Partial<Parameters<typeof insertUser>[1]> = {}) {
    return insertUser(db, {
      role: ROLE.COURIER,
      email: 'staff@x.by',
      firstName: 'Иван',
      lastName: 'Петров',
      phone: OLD_PHONE,
      ...seed,
    });
  }

  it('should save the new data and log only the names of the changed fields', async () => {
    const userId = await insertStaff();

    const response = await patchAdminUser(app, admin, userId, {
      firstName: ' Иван ',
      lastName: 'Сидоров',
      phone: '+375 29 777-00-00',
    }).expect(HttpStatus.OK);

    expect(response.body).toMatchObject({
      userId,
      firstName: 'Иван',
      lastName: 'Сидоров',
      phone: NEW_PHONE,
      history: [{ action: ADMIN_ACTION.USER_UPDATED, details: { fields: ['lastName', 'phone'] } }],
    });

    const actions = await findActions(db, userId);
    expect(actions).toEqual([
      {
        actorId: adminId,
        action: ADMIN_ACTION.USER_UPDATED,
        details: { fields: ['lastName', 'phone'] },
      },
    ]);
    expect(JSON.stringify(actions)).not.toMatch(/Петров|Сидоров|375/);
  });

  it('should write nothing when the data does not change', async () => {
    const userId = await insertStaff();

    const response = await patchAdminUser(app, admin, userId, {
      firstName: 'Иван',
      phone: OLD_PHONE,
    }).expect(HttpStatus.OK);

    expect(response.body.history).toEqual([]);
    expect(await findActions(db, userId)).toHaveLength(0);
  });

  it.each([
    ['an invited manager', { role: ROLE.MANAGER, passwordHash: null }],
    ['a blocked courier', { isBlocked: true }],
  ])('should edit %s', async (_case, seed) => {
    const userId = await insertStaff(seed);

    await patchAdminUser(app, admin, userId, { lastName: 'Новиков' }).expect(HttpStatus.OK);

    const [user] = await db.select().from(users).where(eq(users.userId, userId));
    expect(user.lastName).toBe('Новиков');
  });

  it('should answer 403 for a client and 409 for a deleted courier', async () => {
    const clientId = await insertStaff({ role: ROLE.CLIENT });
    const deletedId = await insertStaff({ email: 'gone@x.by', phone: null, deletedAt: new Date() });

    const client = await patchAdminUser(app, admin, clientId, { lastName: 'Новиков' });
    const deleted = await patchAdminUser(app, admin, deletedId, { lastName: 'Новиков' });

    expect(client.status).toBe(HttpStatus.FORBIDDEN);
    expect(client.body.message).toBe(ADMIN_STAFF_MESSAGES.CLIENT_EDIT_FORBIDDEN);
    expect(deleted.status).toBe(HttpStatus.CONFLICT);
    expect(deleted.body.message).toBe(ADMIN_STAFF_MESSAGES.USER_DELETED);
    expect(await findActions(db, clientId)).toHaveLength(0);
  });

  it.each([{}, { email: 'new@x.by' }, { lastName: 'Новиков', role: ROLE.MANAGER }])(
    'should answer 400 for the body %o',
    async (body) => {
      const userId = await insertStaff();

      await patchAdminUser(app, admin, userId, body).expect(HttpStatus.BAD_REQUEST);

      expect(await findActions(db, userId)).toHaveLength(0);
    },
  );

  it('should answer 409 with the registration message when the phone belongs to someone else', async () => {
    await insertUser(db, { role: ROLE.CLIENT, email: 'owner@x.by', phone: NEW_PHONE });
    const userId = await insertStaff();

    const response = await patchAdminUser(app, admin, userId, { phone: NEW_PHONE }).expect(
      HttpStatus.CONFLICT,
    );

    expect(response.body.message).toBe(USERS_ERROR_MESSAGES.PHONE_TAKEN);
    expect(await findActions(db, userId)).toHaveLength(0);
  });
});
