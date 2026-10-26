import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AUTH_ERROR_MESSAGES } from '@/modules/auth/constants/access.constants';
import { AUTH_ROUTES } from '@/modules/auth/constants/routes.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { createTestApp } from '@test/support/app';
import {
  COOKIE_HEADER,
  endRefreshGraceWindow,
  extractAccessToken,
  extractRefreshToken,
  postAuth,
  refreshCookie,
  registerUser,
  validRegistration,
} from '@test/support/auth';
import { resetTestData } from '@test/support/database';

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

  describe('refresh', () => {
    it('should issue a new refresh token and reject the old one once the grace window is over', async () => {
      const { refreshToken } = await registerUser(app);

      const first = await postAuth(app, AUTH_ROUTES.REFRESH)
        .set(COOKIE_HEADER, refreshCookie(refreshToken))
        .expect(HttpStatus.OK);
      const newToken = extractRefreshToken(first);

      expect(newToken).not.toBe(refreshToken);

      await endRefreshGraceWindow(db);
      await postAuth(app, AUTH_ROUTES.REFRESH)
        .set(COOKIE_HEADER, refreshCookie(refreshToken))
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should set a new access cookie and return the user without tokens when refreshing', async () => {
      const { refreshToken } = await registerUser(app);

      const response = await postAuth(app, AUTH_ROUTES.REFRESH)
        .set(COOKIE_HEADER, refreshCookie(refreshToken))
        .expect(HttpStatus.OK);

      expect(extractAccessToken(response)).toEqual(expect.any(String));
      expect(response.body.user.email).toBe(validRegistration.email);
      expect(response.body).not.toHaveProperty('accessToken');
    });

    it('should revoke the whole session chain when an old token is reused', async () => {
      const { refreshToken } = await registerUser(app);
      const first = await postAuth(app, AUTH_ROUTES.REFRESH)
        .set(COOKIE_HEADER, refreshCookie(refreshToken))
        .expect(HttpStatus.OK);
      const newToken = extractRefreshToken(first);
      await endRefreshGraceWindow(db);

      await postAuth(app, AUTH_ROUTES.REFRESH)
        .set(COOKIE_HEADER, refreshCookie(refreshToken))
        .expect(HttpStatus.UNAUTHORIZED);
      const response = await postAuth(app, AUTH_ROUTES.REFRESH)
        .set(COOKIE_HEADER, refreshCookie(newToken))
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.message).toBe(AUTH_ERROR_MESSAGES.INVALID_SESSION);
    });

    it('should return 401 when there is no refresh cookie', async () => {
      const response = await postAuth(app, AUTH_ROUTES.REFRESH).expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.message).toBe(AUTH_ERROR_MESSAGES.INVALID_SESSION);
    });
  });
});
