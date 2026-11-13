import type { NestExpressApplication } from '@nestjs/platform-express';
import { asc, eq } from 'drizzle-orm';
import type { Database } from '@/database/database.module';
import { adminActions } from '@/database/schema';
import { ADMIN_STAFF_ROUTES } from '@/modules/admin/constants/admin-staff.constants';
import { ADMIN_ROUTES } from '@/modules/admin/constants/admin-users.constants';
import { withCookies } from './admin';
import { patchApi, postApi } from './http';

export const STAFF_COURIER = {
  role: 'courier',
  firstName: 'Павел',
  lastName: 'Орлов',
  email: 'pavel.orlov@example.com',
  phone: '+375291112233',
};

export const STAFF_MANAGER = {
  role: 'manager',
  firstName: 'Анна',
  lastName: 'Белова',
  email: 'anna.belova@example.com',
  phone: '+375293334455',
};

export type StaffInviteBody = {
  userId: number;
  email: string;
  setPasswordUrl: string;
  expiresAt: string;
  emailSent: boolean;
};

export function postStaff(
  app: NestExpressApplication,
  cookies: string | null,
  body: Record<string, unknown>,
) {
  return withCookies(
    postApi(app, `${ADMIN_ROUTES.BASE}/${ADMIN_STAFF_ROUTES.STAFF}`).send(body),
    cookies,
  );
}

export function postResend(app: NestExpressApplication, cookies: string | null, userId: number) {
  return withCookies(
    postApi(app, `${ADMIN_ROUTES.BASE}/${ADMIN_ROUTES.USERS}/${userId}/invite`),
    cookies,
  );
}

export function patchAdminUser(
  app: NestExpressApplication,
  cookies: string | null,
  userId: number,
  body: Record<string, unknown>,
) {
  return withCookies(
    patchApi(app, `${ADMIN_ROUTES.BASE}/${ADMIN_ROUTES.USERS}/${userId}`).send(body),
    cookies,
  );
}

export function tokenOf(setPasswordUrl: string): string {
  return new URL(setPasswordUrl).pathname.split('/').at(-1) ?? '';
}

export function findActions(db: Database, targetUserId: number) {
  return db
    .select({
      actorId: adminActions.actorId,
      action: adminActions.action,
      details: adminActions.details,
    })
    .from(adminActions)
    .where(eq(adminActions.targetUserId, targetUserId))
    .orderBy(asc(adminActions.adminActionId));
}
