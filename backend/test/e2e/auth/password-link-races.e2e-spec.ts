import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ROLE } from '@/common/enums/role.enum';
import { TOKEN_KIND } from '@/common/enums/token-kind.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { createTestApp } from '@test/support/app';
import { resetTestData } from '@test/support/database';
import { sortedStatuses } from '@test/support/http';
import {
  createInvitedStaff,
  issueLink,
  NEW_PASSWORD,
  postPasswordLink,
} from '@test/support/password-links';

const ATTEMPTS = 2;

describe('Setting a password through a link at the same time (e2e)', () => {
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

  it('should let exactly one of two requests through when both use the same link', async () => {
    const courier = await createInvitedStaff(db, ROLE.COURIER);
    const token = await issueLink(app, courier.userId, TOKEN_KIND.INVITE);

    const responses = await Promise.all(
      Array.from({ length: ATTEMPTS }, () => postPasswordLink(app, token, NEW_PASSWORD)),
    );

    expect(sortedStatuses(responses)).toEqual([HttpStatus.OK, HttpStatus.NOT_FOUND]);
  });
});
