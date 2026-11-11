import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AUTH_ROUTES } from '@/modules/auth/constants/routes.constants';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from '@/modules/auth/constants/tokens.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { createTestApp } from '@test/support/app';
import {
  COOKIE_HEADER,
  extractCookieValue,
  postAuth,
  refreshCookie,
  registerUser,
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

  describe('logout', () => {
    it('should return 204 and make the refresh token unusable when logging out', async () => {
      const { cookies, refreshToken } = await registerUser(app);

      await postAuth(app, AUTH_ROUTES.LOGOUT)
        .set(COOKIE_HEADER, cookies)
        .expect(HttpStatus.NO_CONTENT);
      await postAuth(app, AUTH_ROUTES.REFRESH)
        .set(COOKIE_HEADER, refreshCookie(refreshToken))
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should clear both session cookies when logging out', async () => {
      const { cookies } = await registerUser(app);

      const response = await postAuth(app, AUTH_ROUTES.LOGOUT)
        .set(COOKIE_HEADER, cookies)
        .expect(HttpStatus.NO_CONTENT);

      expect(extractCookieValue(response, ACCESS_COOKIE_NAME)).toBe('');
      expect(extractCookieValue(response, REFRESH_COOKIE_NAME)).toBe('');
    });

    it('should return 204 when there is no refresh cookie', async () => {
      await postAuth(app, AUTH_ROUTES.LOGOUT).expect(HttpStatus.NO_CONTENT);
    });
  });
});
