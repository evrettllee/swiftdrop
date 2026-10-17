import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { AUTH_ROUTES } from '../../../src/modules/auth/constants/routes.constants';
import { AUTH_VALIDATION_MESSAGES } from '../../../src/modules/auth/constants/validation.constants';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { users } from '../../../src/database/schema';
import { createTestApp } from '../../support/app';
import { postAuth, validRegistration } from '../../support/auth';
import { resetTestData } from '../../support/database';

const INVALID_NAMES = ['Иван123', '-Иван', 'Иван--Петров', 'Иван!', '<b>Иван</b>', '😀Иван'];
const VALID_NAMES = ['Анна-Мария', "О'Брайен", 'Jean Paul', 'Ёлкин'];

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

  describe('register', () => {
    it('should return 400 with field errors when the password is weak', async () => {
      const response = await postAuth(app, AUTH_ROUTES.REGISTER)
        .send({ ...validRegistration, password: 'abc' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'password' })]),
      );
    });

    it.each(INVALID_NAMES)(
      'should return 400 with errors for both name fields when the name is %s',
      async (name) => {
        const response = await postAuth(app, AUTH_ROUTES.REGISTER)
          .send({ ...validRegistration, firstName: name, lastName: name })
          .expect(HttpStatus.BAD_REQUEST);

        expect(response.body.errors).toEqual([
          { field: 'firstName', message: AUTH_VALIDATION_MESSAGES.FIRST_NAME_INVALID },
          { field: 'lastName', message: AUTH_VALIDATION_MESSAGES.LAST_NAME_INVALID },
        ]);
      },
    );

    it.each(VALID_NAMES)('should register a user when the name is %s', async (name) => {
      const response = await postAuth(app, AUTH_ROUTES.REGISTER)
        .send({ ...validRegistration, firstName: name, lastName: name })
        .expect(HttpStatus.CREATED);

      expect(response.body.user).toMatchObject({ firstName: name, lastName: name });
    });

    it('should save the names without the spaces around them', async () => {
      await postAuth(app, AUTH_ROUTES.REGISTER)
        .send({ ...validRegistration, firstName: '  Анна-Мария ', lastName: ' О’Брайен  ' })
        .expect(HttpStatus.CREATED);
      const [saved] = await db.select().from(users).where(eq(users.email, validRegistration.email));

      expect(saved).toMatchObject({ firstName: 'Анна-Мария', lastName: 'О’Брайен' });
    });
  });
});
