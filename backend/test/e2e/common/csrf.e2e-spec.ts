import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { AUTH_ROUTES } from '../../../src/modules/auth/constants/routes.constants';
import { CSRF_ERROR_MESSAGE, CSRF_HEADER_NAME } from '../../../src/common/constants/csrf.constants';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { users } from '../../../src/database/schema';
import { createTestApp } from '../../support/app';
import {
  COOKIE_HEADER,
  getAuth,
  postAuth,
  rawPostAuth,
  refreshCookie,
  registerUser,
  validRegistration,
} from '../../support/auth';
import { resetTestData } from '../../support/database';

const WRONG_HEADER_VALUE = 'something-else';

describe('CSRF protection (e2e)', () => {
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

  it('should reject a login without the header before checking the credentials', async () => {
    await registerUser(app);

    const response = await rawPostAuth(app, AUTH_ROUTES.LOGIN)
      .send({ email: validRegistration.email, password: validRegistration.password })
      .expect(HttpStatus.FORBIDDEN);

    expect(response.body.message).toBe(CSRF_ERROR_MESSAGE);
  });

  it('should reject a registration without the header and create no user', async () => {
    await rawPostAuth(app, AUTH_ROUTES.REGISTER)
      .send(validRegistration)
      .expect(HttpStatus.FORBIDDEN);

    expect(
      await db.select().from(users).where(eq(users.email, validRegistration.email)),
    ).toHaveLength(0);
  });

  it('should reject a refresh without the header and leave the token usable', async () => {
    const { refreshToken } = await registerUser(app);

    await rawPostAuth(app, AUTH_ROUTES.REFRESH)
      .set(COOKIE_HEADER, refreshCookie(refreshToken))
      .expect(HttpStatus.FORBIDDEN);
    await postAuth(app, AUTH_ROUTES.REFRESH)
      .set(COOKIE_HEADER, refreshCookie(refreshToken))
      .expect(HttpStatus.OK);
  });

  it('should reject a logout without the header and keep the session alive', async () => {
    const { cookies, refreshToken } = await registerUser(app);

    await rawPostAuth(app, AUTH_ROUTES.LOGOUT)
      .set(COOKIE_HEADER, cookies)
      .expect(HttpStatus.FORBIDDEN);
    await postAuth(app, AUTH_ROUTES.REFRESH)
      .set(COOKIE_HEADER, refreshCookie(refreshToken))
      .expect(HttpStatus.OK);
  });

  it('should reject a request whose header has a wrong value', async () => {
    await rawPostAuth(app, AUTH_ROUTES.LOGIN)
      .set(CSRF_HEADER_NAME, WRONG_HEADER_VALUE)
      .send({ email: validRegistration.email, password: validRegistration.password })
      .expect(HttpStatus.FORBIDDEN);
  });

  it('should not require the header for a safe GET request', async () => {
    const { cookies } = await registerUser(app);

    await getAuth(app, AUTH_ROUTES.ME).set(COOKIE_HEADER, cookies).expect(HttpStatus.OK);
  });
});
