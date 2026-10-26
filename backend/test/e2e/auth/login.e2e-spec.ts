import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  AUTH_ERROR_MESSAGES,
  AUTH_THROTTLE_LIMIT,
} from '@/modules/auth/constants/access.constants';
import { AUTH_ROUTES } from '@/modules/auth/constants/routes.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { createTestApp } from '@test/support/app';
import {
  extractAccessToken,
  extractRefreshToken,
  postAuth,
  registerUser,
  validRegistration,
  WRONG_PASSWORD,
  UNKNOWN_EMAIL,
} from '@test/support/auth';
import { CLIENT_IP_HEADER } from '@test/support/constants';
import { resetTestData } from '@test/support/database';
import { nextClientIp } from '@test/support/http';
import { blockUser } from '@test/support/users';

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

  describe('login', () => {
    it('should return the user and set both session cookies when the credentials are valid', async () => {
      await registerUser(app);

      const response = await postAuth(app, AUTH_ROUTES.LOGIN)
        .send({ email: validRegistration.email, password: validRegistration.password })
        .expect(HttpStatus.OK);

      expect(response.body.user.email).toBe(validRegistration.email);
      expect(response.body).not.toHaveProperty('accessToken');
      expect(extractAccessToken(response)).toEqual(expect.any(String));
      expect(extractRefreshToken(response)).toEqual(expect.any(String));
    });

    it('should accept the email in any letter case when logging in', async () => {
      await registerUser(app);

      await postAuth(app, AUTH_ROUTES.LOGIN)
        .send({ email: 'IVAN@Example.COM', password: validRegistration.password })
        .expect(HttpStatus.OK);
    });

    it('should give the same answer when the password is wrong and when the email is unknown', async () => {
      await registerUser(app);

      const wrongPassword = await postAuth(app, AUTH_ROUTES.LOGIN)
        .send({ email: validRegistration.email, password: WRONG_PASSWORD })
        .expect(HttpStatus.UNAUTHORIZED);
      const unknownEmail = await postAuth(app, AUTH_ROUTES.LOGIN)
        .send({ email: UNKNOWN_EMAIL, password: validRegistration.password })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(wrongPassword.body.message).toBe(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
      expect(unknownEmail.body).toEqual(wrongPassword.body);
    });

    it('should return 403 when the account is blocked and the password is right', async () => {
      await registerUser(app);
      await blockUser(db, validRegistration.email);

      const response = await postAuth(app, AUTH_ROUTES.LOGIN)
        .send({ email: validRegistration.email, password: validRegistration.password })
        .expect(HttpStatus.FORBIDDEN);

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

      expect(statuses).toEqual([
        ...Array.from({ length: AUTH_THROTTLE_LIMIT }, () => HttpStatus.UNAUTHORIZED),
        HttpStatus.TOO_MANY_REQUESTS,
      ]);
    });
  });
});
