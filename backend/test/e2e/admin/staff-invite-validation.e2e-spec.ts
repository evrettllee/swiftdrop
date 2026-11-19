import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { VALIDATION_ERROR_MESSAGE } from '@/common/constants/http.constants';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { USERS_ERROR_MESSAGES } from '@/modules/users/constants/users.constants';
import { createTestApp } from '@test/support/app';
import { createAdmin, insertUser } from '@test/support/admin';
import { postStaff, STAFF_COURIER } from '@test/support/admin-staff';
import { resetTestData } from '@test/support/database';
import { mailGatewayOf } from '@test/support/mail';
import { findUsers } from '@test/support/users';

type ValidationBody = { message: string; errors: { field: string; message: string }[] };

function fieldsOf(body: ValidationBody): string[] {
  return body.errors.map((error) => error.field);
}

describe('Admin staff invite validation (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    mailGatewayOf(app).clearSentMails();
    admin = await createAdmin(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should answer 409 with the registration message when the email is taken in another case', async () => {
    await insertUser(db, { role: ROLE.CLIENT, email: STAFF_COURIER.email });
    const usersBefore = (await findUsers(db)).length;

    const response = await postStaff(app, admin, {
      ...STAFF_COURIER,
      email: ` ${STAFF_COURIER.email.toUpperCase()} `,
    }).expect(HttpStatus.CONFLICT);

    expect(response.body.message).toBe(USERS_ERROR_MESSAGES.EMAIL_TAKEN);
    expect(await findUsers(db)).toHaveLength(usersBefore);
    expect(mailGatewayOf(app).sentMails).toHaveLength(0);
  });

  it('should answer 409 with the registration message when the phone is taken', async () => {
    await insertUser(db, { role: ROLE.CLIENT, email: 'other@x.by', phone: STAFF_COURIER.phone });

    const response = await postStaff(app, admin, STAFF_COURIER).expect(HttpStatus.CONFLICT);

    expect(response.body.message).toBe(USERS_ERROR_MESSAGES.PHONE_TAKEN);
  });

  it.each([ROLE.ADMIN, ROLE.CLIENT, 'boss'])('should reject the role %s', async (role) => {
    const response = await postStaff(app, admin, { ...STAFF_COURIER, role }).expect(
      HttpStatus.BAD_REQUEST,
    );

    expect(fieldsOf(response.body)).toEqual(['role']);
  });

  it('should name every wrong field when the data is invalid', async () => {
    const response = await postStaff(app, admin, {
      role: ROLE.COURIER,
      firstName: 'П',
      lastName: '',
      email: 'nope',
      phone: '12',
    }).expect(HttpStatus.BAD_REQUEST);

    expect(response.body.message).toBe(VALIDATION_ERROR_MESSAGE);
    expect(fieldsOf(response.body).toSorted()).toEqual(
      ['email', 'firstName', 'lastName', 'phone'].toSorted(),
    );
  });

  it.each([{ passwordHash: 'x' }, { isBlocked: true }, { roleId: 1 }])(
    'should reject an unknown key %o',
    async (extra) => {
      await postStaff(app, admin, { ...STAFF_COURIER, ...extra }).expect(HttpStatus.BAD_REQUEST);

      expect(await findUsers(db)).toHaveLength(1);
    },
  );
});
