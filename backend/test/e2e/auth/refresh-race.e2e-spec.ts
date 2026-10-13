import type { NestExpressApplication } from '@nestjs/platform-express';
import { AUTH_ROUTES } from '../../../src/modules/auth/constants/routes.constants';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { createTestApp } from '../../support/app';
import {
  COOKIE_HEADER,
  endRefreshGraceWindow,
  extractRefreshToken,
  postAuth,
  refreshCookie,
  registerUser,
  validRegistration,
} from '../../support/auth';
import { resetTestData } from '../../support/database';
import { sortedStatuses } from '../../support/http';

const PARALLEL_TABS = 2;
const HTTP_OK = 200;
const HTTP_UNAUTHORIZED = 401;
const HTTP_NO_CONTENT = 204;

describe('Refresh token reuse (e2e)', () => {
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

  function refresh(token: string) {
    return postAuth(app, AUTH_ROUTES.REFRESH).set(COOKIE_HEADER, refreshCookie(token));
  }

  it('should keep the user signed in when two tabs refresh with the same token at once', async () => {
    const { refreshToken } = await registerUser(app);

    const responses = await Promise.all(
      Array.from({ length: PARALLEL_TABS }, () => refresh(refreshToken)),
    );

    expect(sortedStatuses(responses)).toEqual([HTTP_OK, HTTP_OK]);
    for (const response of responses) {
      await refresh(extractRefreshToken(response)).expect(HTTP_OK);
    }
  });

  it('should revoke every session when a rotated token is used again after the grace window', async () => {
    const { refreshToken } = await registerUser(app);
    const rotated = await refresh(refreshToken).expect(HTTP_OK);
    await endRefreshGraceWindow(db);

    await refresh(refreshToken).expect(HTTP_UNAUTHORIZED);

    await refresh(extractRefreshToken(rotated)).expect(HTTP_UNAUTHORIZED);
  });

  it('should revoke every session at once when a token is used again after the logout', async () => {
    const first = await registerUser(app);
    const second = await postAuth(app, AUTH_ROUTES.LOGIN)
      .send({ email: validRegistration.email, password: validRegistration.password })
      .expect(HTTP_OK);
    await postAuth(app, AUTH_ROUTES.LOGOUT)
      .set(COOKIE_HEADER, refreshCookie(first.refreshToken))
      .expect(HTTP_NO_CONTENT);

    await refresh(first.refreshToken).expect(HTTP_UNAUTHORIZED);

    await refresh(extractRefreshToken(second)).expect(HTTP_UNAUTHORIZED);
  });

  it('should not open a session with the token rotated a moment before the logout', async () => {
    const { refreshToken } = await registerUser(app);
    const rotated = await refresh(refreshToken).expect(HTTP_OK);
    await postAuth(app, AUTH_ROUTES.LOGOUT)
      .set(COOKIE_HEADER, refreshCookie(extractRefreshToken(rotated)))
      .expect(HTTP_NO_CONTENT);

    await refresh(refreshToken).expect(HTTP_UNAUTHORIZED);
  });
});
