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
  getAdminUsers,
  insertUser,
} from '@test/support/admin';
import { resetTestData } from '@test/support/database';

const DAY_MS = 86_400_000;
const at = (days: number) => new Date(Date.UTC(2026, 0, 1) + days * DAY_MS);

describe('Admin users list (e2e)', () => {
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
      role: ROLE.COURIER,
      email: 'active@x.by',
      lastName: 'Борисов',
      createdAt: at(1),
    });
    await insertUser(db, {
      role: ROLE.COURIER,
      email: 'blocked@x.by',
      lastName: 'Алексеев',
      isBlocked: true,
      createdAt: at(2),
    });
    await insertUser(db, {
      role: ROLE.COURIER,
      email: 'invited@x.by',
      lastName: 'Волков',
      passwordHash: null,
      createdAt: at(3),
    });
    await insertUser(db, {
      role: ROLE.COURIER,
      email: 'deleted@x.by',
      lastName: 'Громов',
      deletedAt: at(5),
      createdAt: at(4),
    });
    await insertUser(db, {
      role: ROLE.CLIENT,
      email: 'client@x.by',
      passwordHash: null,
      createdAt: at(5),
    });
  });

  afterAll(async () => {
    await app.close();
  });

  async function list(query: Record<string, string | number>): Promise<AdminListBody> {
    return (await getAdminUsers(app, admin, query).expect(HttpStatus.OK)).body as AdminListBody;
  }

  it('should give only the users of the tab and never admins when a role is chosen', async () => {
    const clients = await list({ role: ROLE.CLIENT });

    expect(emailsOf(clients)).toEqual(['client@x.by']);
    expect(clients.items[0]).toMatchObject({ status: 'active', ordersCount: 0 });
    await getAdminUsers(app, admin, { role: ROLE.ADMIN }).expect(HttpStatus.BAD_REQUEST);
    await getAdminUsers(app, admin, {}).expect(HttpStatus.BAD_REQUEST);
  });

  it('should hide deleted users by default and give each status when it is filtered', async () => {
    expect(emailsOf(await list({ role: ROLE.COURIER }))).toEqual([
      'invited@x.by',
      'blocked@x.by',
      'active@x.by',
    ]);
    expect(emailsOf(await list({ role: ROLE.COURIER, status: 'blocked' }))).toEqual([
      'blocked@x.by',
    ]);
    expect(emailsOf(await list({ role: ROLE.COURIER, status: 'invited' }))).toEqual([
      'invited@x.by',
    ]);
    expect(emailsOf(await list({ role: ROLE.COURIER, status: 'deleted' }))).toEqual([
      'deleted@x.by',
    ]);
    expect(emailsOf(await list({ role: ROLE.CLIENT, status: 'invited' }))).toEqual([]);
  });

  it('should give the courier fields and the status of every item', async () => {
    const { items } = await list({ role: ROLE.COURIER, status: 'invited,blocked' });

    expect(items.map((item) => item.status)).toEqual(['invited', 'blocked']);
    expect(items[0]).toMatchObject({ vehicleType: null, deliveredCount: 0, lastLoginAt: null });
    expect(Object.keys(items[0]).sort()).toEqual(
      [
        'userId',
        'firstName',
        'lastName',
        'email',
        'phone',
        'status',
        'createdAt',
        'lastLoginAt',
        'vehicleType',
        'deliveredCount',
      ].sort(),
    );
  });

  it('should sort by newest, oldest and name when the sort is chosen', async () => {
    const all = 'active,blocked,invited,deleted';

    expect(emailsOf(await list({ role: ROLE.COURIER, status: all, sort: 'oldest' }))).toEqual([
      'active@x.by',
      'blocked@x.by',
      'invited@x.by',
      'deleted@x.by',
    ]);
    expect(emailsOf(await list({ role: ROLE.COURIER, status: all, sort: 'name' }))).toEqual([
      'blocked@x.by',
      'active@x.by',
      'invited@x.by',
      'deleted@x.by',
    ]);
    await getAdminUsers(app, admin, { role: ROLE.COURIER, sort: 'email' }).expect(
      HttpStatus.BAD_REQUEST,
    );
  });

  it('should keep the next page stable when a user is added after the first page', async () => {
    const first = await list({ role: ROLE.COURIER, limit: 2 });
    await insertUser(db, { role: ROLE.COURIER, email: 'late@x.by', createdAt: at(9) });
    const second = await list({ role: ROLE.COURIER, limit: 2, page: 2, until: first.until ?? 0 });

    expect(first).toMatchObject({ total: 3, page: 1, limit: 2 });
    expect(emailsOf(first)).toEqual(['invited@x.by', 'blocked@x.by']);
    expect(second).toMatchObject({ total: 3, page: 2, until: first.until });
    expect(emailsOf(second)).toEqual(['active@x.by']);
  });
});
