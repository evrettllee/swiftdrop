import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { AUTH_ROUTES } from '@/modules/auth/constants/routes.constants';
import {
  ACCESS_COOKIE_NAME,
  ACCESS_COOKIE_PATH,
  ACCESS_TOKEN_TTL_SECONDS,
  AUTH_COOKIE_SAME_SITE,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_TTL_MS,
} from '@/modules/auth/constants/tokens.constants';
import { MS_PER_SECOND } from '@/common/constants/time.constants';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { users } from '@/database/schema';
import { USERS_ERROR_MESSAGES } from '@/modules/users/constants/users.constants';
import { createTestApp } from '@test/support/app';
import { findSetCookie, postAuth, registerUser, validRegistration } from '@test/support/auth';
import { resetTestData } from '@test/support/database';
import { sortedStatuses } from '@test/support/http';

const SECOND_USER = {
  ...validRegistration,
  email: 'anna@example.com',
  phone: '+375297654321',
};

describe('Auth (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('register', () => {
    it('should create a client and keep tokens out of the response body when the data is valid', async () => {
      const response = await postAuth(app, AUTH_ROUTES.REGISTER)
        .send(validRegistration)
        .expect(HttpStatus.CREATED);

      expect(response.body.user).toMatchObject({
        email: validRegistration.email,
        phone: validRegistration.phone,
        role: ROLE.CLIENT,
      });
      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('accessToken');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    it('should set httpOnly access and refresh cookies with their own paths and lifetimes when registering', async () => {
      const response = await postAuth(app, AUTH_ROUTES.REGISTER)
        .send(validRegistration)
        .expect(HttpStatus.CREATED);
      const accessSetCookie = findSetCookie(response, ACCESS_COOKIE_NAME) ?? '';
      const refreshSetCookie = findSetCookie(response, REFRESH_COOKIE_NAME) ?? '';

      expect(accessSetCookie).toContain('HttpOnly');
      expect(accessSetCookie).toContain(`Path=${ACCESS_COOKIE_PATH};`);
      expect(accessSetCookie).toContain(`Max-Age=${ACCESS_TOKEN_TTL_SECONDS};`);
      expect(refreshSetCookie).toContain('HttpOnly');
      expect(refreshSetCookie).toContain(`Path=${REFRESH_COOKIE_PATH};`);
      expect(refreshSetCookie).toContain(`Max-Age=${REFRESH_TOKEN_TTL_MS / MS_PER_SECOND};`);
      expect(accessSetCookie.toLowerCase()).toContain(`samesite=${AUTH_COOKIE_SAME_SITE}`);
      expect(refreshSetCookie.toLowerCase()).toContain(`samesite=${AUTH_COOKIE_SAME_SITE}`);
    });

    it('should return 409 with the email message when the email is taken', async () => {
      await registerUser(app);

      const response = await postAuth(app, AUTH_ROUTES.REGISTER)
        .send({ ...SECOND_USER, email: validRegistration.email })
        .expect(HttpStatus.CONFLICT);

      expect(response.body.message).toBe(USERS_ERROR_MESSAGES.EMAIL_TAKEN);
    });

    it('should return 409 with the phone message when the phone is taken', async () => {
      await registerUser(app);

      const response = await postAuth(app, AUTH_ROUTES.REGISTER)
        .send({ ...SECOND_USER, phone: validRegistration.phone })
        .expect(HttpStatus.CONFLICT);

      expect(response.body.message).toBe(USERS_ERROR_MESSAGES.PHONE_TAKEN);
    });

    it('should treat the email as case-insensitive when checking duplicates', async () => {
      await registerUser(app);

      const response = await postAuth(app, AUTH_ROUTES.REGISTER)
        .send({ ...SECOND_USER, email: validRegistration.email.toUpperCase() })
        .expect(HttpStatus.CONFLICT);

      expect(response.body.message).toBe(USERS_ERROR_MESSAGES.EMAIL_TAKEN);
    });

    it('should create only one user when two identical registrations arrive at once', async () => {
      const responses = await Promise.all([
        postAuth(app, AUTH_ROUTES.REGISTER).send(validRegistration),
        postAuth(app, AUTH_ROUTES.REGISTER).send(validRegistration),
      ]);
      const created = await db.select().from(users).where(eq(users.email, validRegistration.email));

      expect(sortedStatuses(responses)).toEqual([HttpStatus.CREATED, HttpStatus.CONFLICT]);
      expect(created).toHaveLength(1);
    });
  });
});
