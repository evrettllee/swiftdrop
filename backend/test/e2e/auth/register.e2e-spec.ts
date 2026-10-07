import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { AUTH_ROUTES } from '../../../src/auth/constants/routes.constants';
import {
  ACCESS_COOKIE_NAME,
  ACCESS_COOKIE_PATH,
  ACCESS_TOKEN_TTL_SECONDS,
  AUTH_COOKIE_SAME_SITE,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_TTL_MS,
} from '../../../src/auth/constants/tokens.constants';
import { MS_PER_SECOND } from '../../../src/common/constants/time.constants';
import { ROLE } from '../../../src/common/enums/role.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { users } from '../../../src/db/schema';
import { USERS_ERROR_MESSAGES } from '../../../src/users/users.constants';
import { createTestApp } from '../../support/app';
import { findSetCookie, postAuth, registerUser, validRegistration } from '../../support/auth';
import { resetTestData } from '../../support/database';
import { sortedStatuses } from '../../support/http';

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
        .expect(201);

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
        .expect(201);
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
        .expect(409);

      expect(response.body.message).toBe(USERS_ERROR_MESSAGES.EMAIL_TAKEN);
    });

    it('should return 409 with the phone message when the phone is taken', async () => {
      await registerUser(app);

      const response = await postAuth(app, AUTH_ROUTES.REGISTER)
        .send({ ...SECOND_USER, phone: validRegistration.phone })
        .expect(409);

      expect(response.body.message).toBe(USERS_ERROR_MESSAGES.PHONE_TAKEN);
    });

    it('should treat the email as case-insensitive when checking duplicates', async () => {
      await registerUser(app);

      const response = await postAuth(app, AUTH_ROUTES.REGISTER)
        .send({ ...SECOND_USER, email: validRegistration.email.toUpperCase() })
        .expect(409);

      expect(response.body.message).toBe(USERS_ERROR_MESSAGES.EMAIL_TAKEN);
    });

    it('should create only one user when two identical registrations arrive at once', async () => {
      const responses = await Promise.all([
        postAuth(app, AUTH_ROUTES.REGISTER).send(validRegistration),
        postAuth(app, AUTH_ROUTES.REGISTER).send(validRegistration),
      ]);
      const created = await db.select().from(users).where(eq(users.email, validRegistration.email));

      expect(sortedStatuses(responses)).toEqual([201, 409]);
      expect(created).toHaveLength(1);
    });
  });
});
