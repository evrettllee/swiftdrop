import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AUTH_ERROR_MESSAGES } from '../../../src/modules/auth/constants/access.constants';
import { AUTH_ROUTES } from '../../../src/modules/auth/constants/routes.constants';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { createTestApp } from '../../support/app';
import {
  accessCookie,
  AUTHORIZATION_HEADER,
  COOKIE_HEADER,
  getAuth,
  registerUser,
  validRegistration,
} from '../../support/auth';
import { resetTestData } from '../../support/database';
import { blockUser } from '../../support/users';

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

  describe('me', () => {
    it('should return the current user when the access cookie is valid', async () => {
      const { cookies } = await registerUser(app);

      const response = await getAuth(app, AUTH_ROUTES.ME)
        .set(COOKIE_HEADER, cookies)
        .expect(HttpStatus.OK);

      expect(response.body.email).toBe(validRegistration.email);
    });

    it('should return 401 when there is no access cookie', async () => {
      const response = await getAuth(app, AUTH_ROUTES.ME).expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.message).toBe(AUTH_ERROR_MESSAGES.UNAUTHORIZED);
    });

    it('should return 401 when the access cookie holds a broken token', async () => {
      const response = await getAuth(app, AUTH_ROUTES.ME)
        .set(COOKIE_HEADER, accessCookie('broken'))
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.message).toBe(AUTH_ERROR_MESSAGES.UNAUTHORIZED);
    });

    it('should not accept a valid token sent in the Authorization header', async () => {
      const { accessToken } = await registerUser(app);

      await getAuth(app, AUTH_ROUTES.ME)
        .set(AUTHORIZATION_HEADER, `Bearer ${accessToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject a valid cookie right away when the user gets blocked', async () => {
      const { cookies } = await registerUser(app);
      await blockUser(db, validRegistration.email);

      await getAuth(app, AUTH_ROUTES.ME)
        .set(COOKIE_HEADER, cookies)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
