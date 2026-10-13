import type { NestExpressApplication } from '@nestjs/platform-express';
import { AUTH_ROUTES } from '../../../src/modules/auth/constants/routes.constants';
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from '../../../src/modules/auth/constants/tokens.constants';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { createTestApp } from '../../support/app';
import {
  COOKIE_HEADER,
  extractCookieValue,
  postAuth,
  refreshCookie,
  registerUser,
} from '../../support/auth';
import { resetTestData } from '../../support/database';

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
});
