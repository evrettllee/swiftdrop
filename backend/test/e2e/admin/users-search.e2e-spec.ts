import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { createTestApp } from '@test/support/app';
import {
  type AdminListBody,
  createAdmin,
  emailsOf,
  getAdminUserCounts,
  getAdminUsers,
  insertUser,
} from '@test/support/admin';
import { resetTestData } from '@test/support/database';

describe('Admin users search and counts (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    admin = await createAdmin(app, db);
    await insertUser(db, {
      role: ROLE.CLIENT,
      firstName: 'Мария',
      lastName: 'Кузнецова',
      email: 'maria.k@mail.by',
      phone: '+375291234567',
    });
    await insertUser(db, {
      role: ROLE.CLIENT,
      firstName: 'Олег',
      lastName: 'Смирнов',
      email: 'oleg@mail.by',
    });
    await insertUser(db, {
      role: ROLE.COURIER,
      firstName: 'Мария',
      lastName: 'Орлова',
      email: 'orlova@mail.by',
    });
    await insertUser(db, {
      role: ROLE.MANAGER,
      firstName: 'Мария',
      lastName: 'Белова',
      email: 'belova@mail.by',
      isBlocked: true,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  async function search(q: string, role: string = ROLE.CLIENT): Promise<string[]> {
    const response = await getAdminUsers(app, admin, { role, q }).expect(HttpStatus.OK);

    return emailsOf(response.body as AdminListBody);
  }

  it('should find a user by a part of the name when the query is text', async () => {
    expect(await search('кузнец')).toEqual(['maria.k@mail.by']);
    expect(await search('Мария Куз')).toEqual(['maria.k@mail.by']);
  });

  it('should find a user by a part of the email when the query is text', async () => {
    expect(await search('oleg@')).toEqual(['oleg@mail.by']);
  });

  it.each(['+375 (29) 123-45-67', '8 029 123 45 67', '291234567', '375291234567'])(
    'should find the user by the exact phone when it is written as %s',
    async (phone) => {
      expect(await search(phone)).toEqual(['maria.k@mail.by']);
    },
  );

  it('should not match a phone by a part of it when only seven digits are given', async () => {
    expect(await search('1234567')).toEqual([]);
  });

  it.each(['%', '_', '\\'])(
    'should match nothing when the query is only the wildcard %s',
    async (q) => {
      expect(await search(q)).toEqual([]);
    },
  );

  it('should count every tab with the search and the status filters', async () => {
    const counts = async (query: Record<string, string>) =>
      (await getAdminUserCounts(app, admin, query).expect(HttpStatus.OK)).body as unknown;

    expect(await counts({})).toEqual({ client: 2, courier: 1, manager: 1 });
    expect(await counts({ q: 'мария' })).toEqual({ client: 1, courier: 1, manager: 1 });
    expect(await counts({ q: 'мария', status: 'active' })).toEqual({
      client: 1,
      courier: 1,
      manager: 0,
    });
    expect(await counts({ status: 'deleted' })).toEqual({ client: 0, courier: 0, manager: 0 });
  });
});
