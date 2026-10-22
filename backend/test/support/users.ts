import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { hash } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';
import type { ROLE, RoleName } from '../../src/common/enums/role.enum';
import type { Database } from '../../src/database/database.module';
import { roles, userOauthAccounts, users } from '../../src/database/schema';
import { AUTH_ROUTES } from '../../src/modules/auth/constants/routes.constants';
import { postAuth, sessionCookieHeader, validRegistration } from './auth';

type Account = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

export const MANAGER_ACCOUNT: Account = {
  firstName: 'Елена',
  lastName: 'Жукова',
  email: 'manager@example.com',
  phone: '+375297778899',
  password: validRegistration.password,
};

export const ADMIN_ACCOUNT: Account = {
  firstName: 'Сергей',
  lastName: 'Лебедев',
  email: 'admin@example.com',
  phone: '+375256667788',
  password: validRegistration.password,
};

export function findUsers(db: Database) {
  return db.select().from(users);
}

export function findLinks(db: Database) {
  return db.select().from(userOauthAccounts);
}

export async function blockUser(db: Database, email: string): Promise<void> {
  await db.update(users).set({ isBlocked: true }).where(eq(users.email, email));
}

// Staff accounts are not registered through the API, so the account is written straight to the
// database with its role, then logged in. Returns the session cookies.
export async function createUserWithRole(
  app: NestExpressApplication,
  db: Database,
  account: Account,
  role: Exclude<RoleName, typeof ROLE.CLIENT>,
): Promise<string> {
  const { password, ...profile } = account;
  const [userRole] = await db
    .select({ roleId: roles.roleId })
    .from(roles)
    .where(eq(roles.name, role));

  await db.insert(users).values({
    ...profile,
    roleId: userRole.roleId,
    passwordHash: await hash(password),
    emailVerifiedAt: new Date(),
  });

  const response = await postAuth(app, AUTH_ROUTES.LOGIN)
    .send({ email: account.email, password })
    .expect(HttpStatus.OK);

  return sessionCookieHeader(response);
}
