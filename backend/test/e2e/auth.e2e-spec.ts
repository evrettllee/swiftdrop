import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { AUTH_ERROR_MESSAGES, AUTH_THROTTLE_LIMIT } from '../../src/auth/constants/access';
import { AUTH_ROUTES } from '../../src/auth/constants/routes';
import {
  ACCESS_COOKIE_NAME,
  ACCESS_COOKIE_PATH,
  ACCESS_TOKEN_TTL_SECONDS,
  AUTH_COOKIE_SAME_SITE,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_TTL_MS,
} from '../../src/auth/constants/tokens';
import { AUTH_VALIDATION_MESSAGES } from '../../src/auth/constants/validation';
import { MS_PER_SECOND } from '../../src/common/constants/time';
import { ROLE } from '../../src/common/enums/role.enum';
import { DRIZZLE } from '../../src/database/database.constants';
import type { Database } from '../../src/database/database.module';
import { users } from '../../src/db/schema';
import { USERS_ERROR_MESSAGES } from '../../src/users/users.constants';
import { createTestApp } from '../support/app';
import {
  accessCookie,
  AUTHORIZATION_HEADER,
  COOKIE_HEADER,
  extractAccessToken,
  extractCookieValue,
  extractRefreshToken,
  findSetCookie,
  getAuth,
  postAuth,
  refreshCookie,
  registerUser,
  validRegistration,
  WRONG_PASSWORD,
} from '../support/auth';
import { CLIENT_IP_HEADER } from '../support/constants';
import { resetTestData } from '../support/database';
import { nextClientIp, sortedStatuses } from '../support/http';

const INVALID_NAMES = ['Иван123', '-Иван', 'Иван--Петров', 'Иван!', '<b>Иван</b>', '😀Иван'];
const VALID_NAMES = ['Анна-Мария', "О'Брайен", 'Jean Paul', 'Ёлкин'];

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

    it('should return 400 with field errors when the password is weak', async () => {
      const response = await postAuth(app, AUTH_ROUTES.REGISTER)
        .send({ ...validRegistration, password: 'abc' })
        .expect(400);

      expect(response.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'password' })]),
      );
    });

    it.each(INVALID_NAMES)(
      'should return 400 with errors for both name fields when the name is %s',
      async (name) => {
        const response = await postAuth(app, AUTH_ROUTES.REGISTER)
          .send({ ...validRegistration, firstName: name, lastName: name })
          .expect(400);

        expect(response.body.errors).toEqual([
          { field: 'firstName', message: AUTH_VALIDATION_MESSAGES.FIRST_NAME_INVALID },
          { field: 'lastName', message: AUTH_VALIDATION_MESSAGES.LAST_NAME_INVALID },
        ]);
      },
    );

    it.each(VALID_NAMES)('should register a user when the name is %s', async (name) => {
      const response = await postAuth(app, AUTH_ROUTES.REGISTER)
        .send({ ...validRegistration, firstName: name, lastName: name })
        .expect(201);

      expect(response.body.user).toMatchObject({ firstName: name, lastName: name });
    });

    it('should save the names without the spaces around them', async () => {
      await postAuth(app, AUTH_ROUTES.REGISTER)
        .send({ ...validRegistration, firstName: '  Анна-Мария ', lastName: ' О’Брайен  ' })
        .expect(201);
      const [saved] = await db.select().from(users).where(eq(users.email, validRegistration.email));

      expect(saved).toMatchObject({ firstName: 'Анна-Мария', lastName: 'О’Брайен' });
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
    it('should return the user and set both session cookies when the credentials are valid', async () => {
      await registerUser(app);

      const response = await postAuth(app, AUTH_ROUTES.LOGIN)
        .send({ email: validRegistration.email, password: validRegistration.password })
        .expect(200);

      expect(response.body.user.email).toBe(validRegistration.email);
      expect(response.body).not.toHaveProperty('accessToken');
      expect(extractAccessToken(response)).toEqual(expect.any(String));
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

    it('should set a new access cookie and return the user without tokens when refreshing', async () => {
      const { refreshToken } = await registerUser(app);

      const response = await postAuth(app, AUTH_ROUTES.REFRESH)
        .set(COOKIE_HEADER, refreshCookie(refreshToken))
        .expect(200);

      expect(extractAccessToken(response)).toEqual(expect.any(String));
      expect(response.body.user.email).toBe(validRegistration.email);
      expect(response.body).not.toHaveProperty('accessToken');
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
      const { cookies, refreshToken } = await registerUser(app);

      await postAuth(app, AUTH_ROUTES.LOGOUT).set(COOKIE_HEADER, cookies).expect(204);
      await postAuth(app, AUTH_ROUTES.REFRESH)
        .set(COOKIE_HEADER, refreshCookie(refreshToken))
        .expect(401);
    });

    it('should clear both session cookies when logging out', async () => {
      const { cookies } = await registerUser(app);

      const response = await postAuth(app, AUTH_ROUTES.LOGOUT)
        .set(COOKIE_HEADER, cookies)
        .expect(204);

      expect(extractCookieValue(response, ACCESS_COOKIE_NAME)).toBe('');
      expect(extractCookieValue(response, REFRESH_COOKIE_NAME)).toBe('');
    });

    it('should return 204 when there is no refresh cookie', async () => {
      await postAuth(app, AUTH_ROUTES.LOGOUT).expect(204);
    });
  });

  describe('me', () => {
    it('should return the current user when the access cookie is valid', async () => {
      const { cookies } = await registerUser(app);

      const response = await getAuth(app, AUTH_ROUTES.ME).set(COOKIE_HEADER, cookies).expect(200);

      expect(response.body.email).toBe(validRegistration.email);
    });

    it('should return 401 when there is no access cookie', async () => {
      const response = await getAuth(app, AUTH_ROUTES.ME).expect(401);

      expect(response.body.message).toBe(AUTH_ERROR_MESSAGES.UNAUTHORIZED);
    });

    it('should return 401 when the access cookie holds a broken token', async () => {
      const response = await getAuth(app, AUTH_ROUTES.ME)
        .set(COOKIE_HEADER, accessCookie('broken'))
        .expect(401);

      expect(response.body.message).toBe(AUTH_ERROR_MESSAGES.UNAUTHORIZED);
    });

    it('should not accept a valid token sent in the Authorization header', async () => {
      const { accessToken } = await registerUser(app);

      await getAuth(app, AUTH_ROUTES.ME)
        .set(AUTHORIZATION_HEADER, `Bearer ${accessToken}`)
        .expect(401);
    });

    it('should reject a valid cookie right away when the user gets blocked', async () => {
      const { cookies } = await registerUser(app);
      await blockUser(validRegistration.email);

      await getAuth(app, AUTH_ROUTES.ME).set(COOKIE_HEADER, cookies).expect(401);
    });
  });
});
