import type { NestExpressApplication } from '@nestjs/platform-express';
import { AUTH_ERROR_MESSAGES } from '../../../src/auth/constants/access.constants';
import { AUTH_ROUTES } from '../../../src/auth/constants/routes.constants';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { createTestApp } from '../../support/app';
import {
  COOKIE_HEADER,
  extractAccessToken,
  extractRefreshToken,
  postAuth,
  refreshCookie,
  registerUser,
  validRegistration,
} from '../../support/auth';
import { resetTestData } from '../../support/database';
import { sortedStatuses } from '../../support/http';

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
});
