import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import type { AdminAction } from '@/common/enums/admin-action.enum';
import { ROLE, type RoleName } from '@/common/enums/role.enum';
import type { Database } from '@/database/database.module';
import { adminActions, roles, users } from '@/database/schema';
import { ADMIN_ROUTES } from '@/modules/admin/constants/admin-users.constants';
import { COOKIE_HEADER } from './auth';
import { getApi } from './http';
import { ADMIN_ACCOUNT, createUserWithRole } from './users';

export type AdminUserSeed = {
  role: RoleName;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string | null;
  passwordHash?: string | null;
  isBlocked?: boolean;
  deletedAt?: Date | null;
  lastLoginAt?: Date | null;
  createdAt?: Date;
};

const STORED_HASH = '$argon2id$v=19$m=65536,t=3,p=4$c2FsdA$aGFzaA';

export function createAdmin(app: NestExpressApplication, db: Database): Promise<string> {
  return createUserWithRole(app, db, ADMIN_ACCOUNT, ROLE.ADMIN);
}

export async function findUserId(db: Database, email: string): Promise<number> {
  const [user] = await db
    .select({ userId: users.userId })
    .from(users)
    .where(eq(users.email, email));

  return user.userId;
}

export async function insertUser(db: Database, seed: AdminUserSeed): Promise<number> {
  const [role] = await db
    .select({ roleId: roles.roleId })
    .from(roles)
    .where(eq(roles.name, seed.role));
  const [user] = await db
    .insert(users)
    .values({
      roleId: role.roleId,
      firstName: seed.firstName ?? 'Иван',
      lastName: seed.lastName ?? 'Петров',
      email: seed.email,
      phone: seed.phone ?? null,
      passwordHash: seed.passwordHash === undefined ? STORED_HASH : seed.passwordHash,
      isBlocked: seed.isBlocked ?? false,
      deletedAt: seed.deletedAt ?? null,
      lastLoginAt: seed.lastLoginAt ?? null,
      ...(seed.createdAt ? { createdAt: seed.createdAt } : {}),
    })
    .returning({ userId: users.userId });

  return user.userId;
}

export async function insertAdminAction(
  db: Database,
  values: {
    actorId: number;
    targetUserId: number;
    action: AdminAction;
    details?: Record<string, unknown>;
    createdAt?: Date;
  },
): Promise<void> {
  await db.insert(adminActions).values({ details: {}, ...values });
}

export function withCookies<T extends { set(name: string, value: string): T }>(
  request: T,
  cookies: string | null,
): T {
  return cookies === null ? request : request.set(COOKIE_HEADER, cookies);
}

export function getAdminUsers(
  app: NestExpressApplication,
  cookies: string | null,
  query: Record<string, string | number> = {},
) {
  return withCookies(
    getApi(app, `${ADMIN_ROUTES.BASE}/${ADMIN_ROUTES.USERS}`).query(query),
    cookies,
  );
}

export function getAdminUserCounts(
  app: NestExpressApplication,
  cookies: string | null,
  query: Record<string, string> = {},
) {
  return withCookies(
    getApi(app, `${ADMIN_ROUTES.BASE}/${ADMIN_ROUTES.USERS_COUNTS}`).query(query),
    cookies,
  );
}

export function getAdminUser(app: NestExpressApplication, cookies: string | null, userId: number) {
  return withCookies(getApi(app, `${ADMIN_ROUTES.BASE}/${ADMIN_ROUTES.USERS}/${userId}`), cookies);
}

export type AdminListBody = {
  items: { userId: number; status: string; email: string }[];
  total: number;
  page: number;
  limit: number;
  until: number | null;
};

export function emailsOf(body: AdminListBody): string[] {
  return body.items.map((item) => item.email);
}
