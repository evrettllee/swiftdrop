import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AUTH_ROUTES } from '@/modules/auth/constants/routes.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { createTestApp } from '@test/support/app';
import {
  COOKIE_HEADER,
  endRefreshGraceWindow,
  extractRefreshToken,
  postAuth,
  refreshCookie,
  registerUser,
  validRegistration,
} from '@test/support/auth';
import { resetTestData } from '@test/support/database';
import { sortedStatuses } from '@test/support/http';

const PARALLEL_TABS = 2;

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

    expect(sortedStatuses(responses)).toEqual([HttpStatus.OK, HttpStatus.OK]);
    for (const response of responses) {
      await refresh(extractRefreshToken(response)).expect(HttpStatus.OK);
    }
  });

  it('should revoke every session when a rotated token is used again after the grace window', async () => {
    const { refreshToken } = await registerUser(app);
    const rotated = await refresh(refreshToken).expect(HttpStatus.OK);
    await endRefreshGraceWindow(db);

    await refresh(refreshToken).expect(HttpStatus.UNAUTHORIZED);

    await refresh(extractRefreshToken(rotated)).expect(HttpStatus.UNAUTHORIZED);
  });

  it('should revoke every session at once when a token is used again after the logout', async () => {
    const first = await registerUser(app);
    const second = await postAuth(app, AUTH_ROUTES.LOGIN)
      .send({ email: validRegistration.email, password: validRegistration.password })
      .expect(HttpStatus.OK);
    await postAuth(app, AUTH_ROUTES.LOGOUT)
      .set(COOKIE_HEADER, refreshCookie(first.refreshToken))
      .expect(HttpStatus.NO_CONTENT);

    await refresh(first.refreshToken).expect(HttpStatus.UNAUTHORIZED);

    await refresh(extractRefreshToken(second)).expect(HttpStatus.UNAUTHORIZED);
  });

  it('should not open a session with the token rotated a moment before the logout', async () => {
    const { refreshToken } = await registerUser(app);
    const rotated = await refresh(refreshToken).expect(HttpStatus.OK);
    await postAuth(app, AUTH_ROUTES.LOGOUT)
      .set(COOKIE_HEADER, refreshCookie(extractRefreshToken(rotated)))
      .expect(HttpStatus.NO_CONTENT);

    await refresh(refreshToken).expect(HttpStatus.UNAUTHORIZED);
  });
});
