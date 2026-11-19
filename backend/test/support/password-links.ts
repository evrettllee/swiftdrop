import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ROLE } from '@/common/enums/role.enum';
import type { TokenKind } from '@/common/enums/token-kind.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { passwordResetTokens, roles, users } from '@/database/schema';
import { AUTH_ROUTES } from '@/modules/auth/constants/routes.constants';
import type { InvitableRole } from '@/modules/auth/constants/mail.constants';
import { PasswordLinksService } from '@/modules/auth/services/password-links.service';
import { getApi, postApi } from './http';

export const INVITED_COURIER = {
  firstName: 'Павел',
  lastName: 'Орлов',
  email: 'invited.courier@example.com',
};

export const INVITED_MANAGER = {
  firstName: 'Анна',
  lastName: 'Белова',
  email: 'invited.manager@example.com',
};

export const NEW_PASSWORD = 'NewPass123!';

export type InvitedStaff = { userId: number; email: string; firstName: string };

export async function createInvitedStaff(
  db: Database,
  role: InvitableRole,
  account = role === ROLE.COURIER ? INVITED_COURIER : INVITED_MANAGER,
): Promise<InvitedStaff> {
  const [userRole] = await db
    .select({ roleId: roles.roleId })
    .from(roles)
    .where(eq(roles.name, role));
  const [user] = await db
    .insert(users)
    .values({ ...account, roleId: userRole.roleId, passwordHash: null })
    .returning({ userId: users.userId });

  return { userId: user.userId, email: account.email, firstName: account.firstName };
}

export async function issueLink(
  app: NestExpressApplication,
  userId: number,
  kind: TokenKind,
): Promise<string> {
  const db = app.get<Database>(DRIZZLE);
  const service = app.get(PasswordLinksService);
  const { token } = await db.transaction((tx) =>
    service.issue(tx, { userId, kind, createdBy: null }),
  );

  return token;
}

export function findLinks(db: Database, userId: number) {
  return db.select().from(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
}

export async function expireLinks(db: Database, userId: number): Promise<void> {
  await db
    .update(passwordResetTokens)
    .set({ expiresAt: new Date(Date.now() - 1000) })
    .where(eq(passwordResetTokens.userId, userId));
}

function linkPath(token: string): string {
  return `${AUTH_ROUTES.BASE}/${AUTH_ROUTES.PASSWORD_LINKS}/${token}`;
}

export function getPasswordLink(app: NestExpressApplication, token: string) {
  return getApi(app, linkPath(token));
}

export function postPasswordLink(app: NestExpressApplication, token: string, password: string) {
  return postApi(app, linkPath(token)).send({ password });
}
