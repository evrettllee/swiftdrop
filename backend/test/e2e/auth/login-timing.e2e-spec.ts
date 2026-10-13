import { performance } from 'node:perf_hooks';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AUTH_ERROR_MESSAGES } from '../../../src/modules/auth/constants/access.constants';
import { AUTH_ROUTES } from '../../../src/modules/auth/constants/routes.constants';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { createTestApp } from '../../support/app';
import { postAuth, registerUser, validRegistration, WRONG_PASSWORD } from '../../support/auth';
import { resetTestData } from '../../support/database';

const UNKNOWN_EMAIL = 'nobody@example.com';
const ROUNDS = 5;
// An unknown email still costs a full password check, so it takes about as long as a wrong
// password; without the check it would answer many times faster. The margin keeps the test steady.
const MIN_TIME_RATIO = 0.5;
const MAX_TIME_RATIO = 2;
const HTTP_UNAUTHORIZED = 401;

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);

  return sorted[Math.floor(sorted.length / 2)];
}

describe('Login timing (e2e)', () => {
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

  async function timeFailedLogin(email: string, password: string): Promise<number> {
    const started = performance.now();
    const response = await postAuth(app, AUTH_ROUTES.LOGIN)
      .send({ email, password })
      .expect(HTTP_UNAUTHORIZED);

    expect(response.body.message).toBe(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);

    return performance.now() - started;
  }

  it('should take about as long for an unknown email as for a wrong password', async () => {
    await registerUser(app);
    const wrongPassword: number[] = [];
    const unknownEmail: number[] = [];

    // Interleaved, so a slow moment of the machine hits both kinds alike.
    for (let round = 0; round < ROUNDS; round += 1) {
      wrongPassword.push(await timeFailedLogin(validRegistration.email, WRONG_PASSWORD));
      unknownEmail.push(await timeFailedLogin(UNKNOWN_EMAIL, validRegistration.password));
    }

    const ratio = median(unknownEmail) / median(wrongPassword);

    expect(ratio).toBeGreaterThan(MIN_TIME_RATIO);
    expect(ratio).toBeLessThan(MAX_TIME_RATIO);
  });
});
