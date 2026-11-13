import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { RoleName } from '@/common/enums/role.enum';
import { ENV_KEYS } from '@/config/env.constants';
import { ACCESS_TOKEN_TTL_SECONDS } from '@/modules/auth/constants/tokens.constants';
import { ADMIN_ROUTES } from '@/modules/admin/constants/admin-users.constants';
import { CourierShiftEventsService } from '@/modules/couriers/services/courier-shift-events.service';
import type { CourierShiftEvent } from '@/modules/couriers/types/couriers.types';
import { withCookies } from './admin';
import { accessCookie } from './auth';
import { deleteApi, postApi } from './http';

const AGED_TOKEN_SECONDS = 30;

function userPath(userId: number, action: string): string {
  return `${ADMIN_ROUTES.BASE}/${ADMIN_ROUTES.USERS}/${userId}/${action}`;
}

export function postBlock(
  app: NestExpressApplication,
  cookies: string | null,
  userId: number,
  body: object = { reason: 'Жалобы клиентов' },
) {
  return withCookies(postApi(app, userPath(userId, 'block')).send(body), cookies);
}

export function postUnblock(app: NestExpressApplication, cookies: string | null, userId: number) {
  return withCookies(postApi(app, userPath(userId, 'unblock')), cookies);
}

export function postEndSessions(
  app: NestExpressApplication,
  cookies: string | null,
  userId: number,
) {
  return withCookies(postApi(app, userPath(userId, 'sessions/revoke')), cookies);
}

export function postPasswordReset(
  app: NestExpressApplication,
  cookies: string | null,
  userId: number,
) {
  return withCookies(postApi(app, userPath(userId, 'password-reset')), cookies);
}

export function deleteAdminUser(
  app: NestExpressApplication,
  cookies: string | null,
  userId: number,
) {
  return withCookies(
    deleteApi(app, `${ADMIN_ROUTES.BASE}/${ADMIN_ROUTES.USERS}/${userId}`),
    cookies,
  );
}

export async function agedAccessCookie(
  app: NestExpressApplication,
  userId: number,
  role: RoleName,
): Promise<string> {
  const iat = Math.floor(Date.now() / 1000) - AGED_TOKEN_SECONDS;
  const token = await app.get(JwtService).signAsync(
    { sub: String(userId), role, iat },
    {
      secret: app.get(ConfigService).getOrThrow<string>(ENV_KEYS.JWT_ACCESS_SECRET),
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    },
  );

  return accessCookie(token);
}

export function recordShiftEvents(app: NestExpressApplication): CourierShiftEvent[] {
  const events: CourierShiftEvent[] = [];

  app.get(CourierShiftEventsService).subscribe((event) => events.push(event));

  return events;
}
