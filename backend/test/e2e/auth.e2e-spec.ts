import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import {
  AUTH_ERROR_MESSAGES,
  AUTH_ROUTES,
  AUTH_THROTTLE_LIMIT,
} from '../../src/auth/auth.constants';
import { ROLE } from '../../src/common/enums/role.enum';
import { DRIZZLE } from '../../src/database/database.constants';
import type { Database } from '../../src/database/database.module';
import { users } from '../../src/db/schema';
import { USERS_ERROR_MESSAGES } from '../../src/users/users.constants';
import {
  AUTHORIZATION_HEADER,
  COOKIE_HEADER,
  extractRefreshToken,
  getAuth,
  getSetCookies,
  postAuth,
  refreshCookie,
  registerUser,
  validRegistration,
  WRONG_PASSWORD,
} from '../support/auth';
import { nextClientIp, sortedStatuses } from '../support/http';
import { createTestApp } from '../support/app';
import { CLIENT_IP_HEADER } from '../support/constants';
import { resetTestData } from '../support/database';

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

  async function blockUser(email: string): Promise<void> {
    await db.update(users).set({ isBlocked: true }).where(eq(users.email, email));
  }

  describe('register', () => {
    it('should create a client and set a refresh cookie when the data is valid', async () => {
      const response = await postAuth(app, AUTH_ROUTES.REGISTER)
        .send(validRegistration)
        .expect(201);

      expect(response.body.user).toMatchObject({
        email: validRegistration.email,
        phone: validRegistration.phone,
        role: ROLE.CLIENT,
      });
      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(getSetCookies(response).join()).toContain('HttpOnly');
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

    it('should return 400 with field errors when the password is weak', async () => {
      const response = await postAuth(app, AUTH_ROUTES.REGISTER)
        .send({ ...validRegistration, password: 'abc' })
        .expect(400);

      expect(response.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'password' })]),
      );
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

  describe('login', () => {
    it('should return the user and a refresh cookie when the credentials are valid', async () => {
      await registerUser(app);

      const response = await postAuth(app, AUTH_ROUTES.LOGIN)
        .send({ email: validRegistration.email, password: validRegistration.password })
        .expect(200);

      expect(response.body.user.email).toBe(validRegistration.email);
      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(extractRefreshToken(response)).toEqual(expect.any(String));
    });

    it('should accept the email in any letter case when logging in', async () => {
      await registerUser(app);

      await postAuth(app, AUTH_ROUTES.LOGIN)
        .send({ email: 'IVAN@Example.COM', password: validRegistration.password })
        .expect(200);
    });

    it('should give the same answer when the password is wrong and when the email is unknown', async () => {
      await registerUser(app);

      const wrongPassword = await postAuth(app, AUTH_ROUTES.LOGIN)
        .send({ email: validRegistration.email, password: WRONG_PASSWORD })
        .expect(401);
      const unknownEmail = await postAuth(app, AUTH_ROUTES.LOGIN)
        .send({ email: 'nobody@example.com', password: validRegistration.password })
        .expect(401);

      expect(wrongPassword.body.message).toBe(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
      expect(unknownEmail.body).toEqual(wrongPassword.body);
    });

    it('should return 403 when the account is blocked and the password is right', async () => {
      await registerUser(app);
      await blockUser(validRegistration.email);

      const response = await postAuth(app, AUTH_ROUTES.LOGIN)
        .send({ email: validRegistration.email, password: validRegistration.password })
        .expect(403);

      expect(response.body.message).toBe(AUTH_ERROR_MESSAGES.ACCOUNT_BLOCKED);
    });

    it('should return 429 when login attempts from one address exceed the limit', async () => {
      await registerUser(app);
      const ip = nextClientIp();
      const statuses: number[] = [];

      for (let attempt = 0; attempt <= AUTH_THROTTLE_LIMIT; attempt += 1) {
        const response = await postAuth(app, AUTH_ROUTES.LOGIN)
          .set(CLIENT_IP_HEADER, ip)
          .send({ email: validRegistration.email, password: WRONG_PASSWORD });
        statuses.push(response.status);
      }

      expect(statuses).toEqual([...Array.from({ length: AUTH_THROTTLE_LIMIT }, () => 401), 429]);
    });
  });

  describe('refresh', () => {
    it('should issue a new refresh token and reject the old one when rotating', async () => {
      const { refreshToken } = await registerUser(app);

      const first = await postAuth(app, AUTH_ROUTES.REFRESH)
        .set(COOKIE_HEADER, refreshCookie(refreshToken))
        .expect(200);
      const newToken = extractRefreshToken(first);

      expect(newToken).not.toBe(refreshToken);

      await postAuth(app, AUTH_ROUTES.REFRESH)
        .set(COOKIE_HEADER, refreshCookie(refreshToken))
        .expect(401);
    });

    it('should revoke the whole session chain when an old token is reused', async () => {
      const { refreshToken } = await registerUser(app);
      const first = await postAuth(app, AUTH_ROUTES.REFRESH)
        .set(COOKIE_HEADER, refreshCookie(refreshToken))
        .expect(200);
      const newToken = extractRefreshToken(first);

      await postAuth(app, AUTH_ROUTES.REFRESH)
        .set(COOKIE_HEADER, refreshCookie(refreshToken))
        .expect(401);
      const response = await postAuth(app, AUTH_ROUTES.REFRESH)
        .set(COOKIE_HEADER, refreshCookie(newToken))
        .expect(401);

      expect(response.body.message).toBe(AUTH_ERROR_MESSAGES.INVALID_SESSION);
    });

    it('should return 401 when there is no refresh cookie', async () => {
      const response = await postAuth(app, AUTH_ROUTES.REFRESH).expect(401);

      expect(response.body.message).toBe(AUTH_ERROR_MESSAGES.INVALID_SESSION);
    });

    it('should let only one request win when the same token is used twice at once', async () => {
      const { refreshToken } = await registerUser(app);

      const responses = await Promise.all([
        postAuth(app, AUTH_ROUTES.REFRESH).set(COOKIE_HEADER, refreshCookie(refreshToken)),
        postAuth(app, AUTH_ROUTES.REFRESH).set(COOKIE_HEADER, refreshCookie(refreshToken)),
      ]);

      expect(sortedStatuses(responses)).toEqual([200, 401]);
    });
  });

  describe('logout', () => {
    it('should return 204 and make the refresh token unusable when logging out', async () => {
      const { refreshToken } = await registerUser(app);

      await postAuth(app, AUTH_ROUTES.LOGOUT)
        .set(COOKIE_HEADER, refreshCookie(refreshToken))
        .expect(204);
      await postAuth(app, AUTH_ROUTES.REFRESH)
        .set(COOKIE_HEADER, refreshCookie(refreshToken))
        .expect(401);
    });

    it('should return 204 when there is no refresh cookie', async () => {
      await postAuth(app, AUTH_ROUTES.LOGOUT).expect(204);
    });
  });

  describe('me', () => {
    it('should return the current user when the access token is valid', async () => {
      const { body } = await registerUser(app);

      const response = await getAuth(app, AUTH_ROUTES.ME)
        .set(AUTHORIZATION_HEADER, `Bearer ${body.accessToken}`)
        .expect(200);

      expect(response.body.email).toBe(validRegistration.email);
    });

    it('should return 401 when there is no access token', async () => {
      const response = await getAuth(app, AUTH_ROUTES.ME).expect(401);

      expect(response.body.message).toBe(AUTH_ERROR_MESSAGES.UNAUTHORIZED);
    });

    it('should reject a valid token right away when the user gets blocked', async () => {
      const { body } = await registerUser(app);
      await blockUser(validRegistration.email);

      await getAuth(app, AUTH_ROUTES.ME)
        .set(AUTHORIZATION_HEADER, `Bearer ${body.accessToken}`)
        .expect(401);
    });
  });
});
