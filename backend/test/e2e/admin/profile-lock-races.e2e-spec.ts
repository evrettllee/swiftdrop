import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq, isNull } from 'drizzle-orm';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database, Transaction } from '@/database/database.module';
import { courierProfiles, courierShifts } from '@/database/schema';
import { createTestApp } from '@test/support/app';
import { createAdmin, findUserId } from '@test/support/admin';
import { postBlock } from '@test/support/admin-access';
import { postRole } from '@test/support/admin-staff';
import {
  COURIER_ACCOUNT,
  createCourier,
  findCourierProfileId,
  getCourierMe,
} from '@test/support/couriers';
import { resetTestData } from '@test/support/database';
import { commitOnceBlocked } from '@test/support/locks';

describe('Admin block and role change against a courier going on shift (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  let userId: number;
  let profileId: number;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    admin = await createAdmin(app, db);
    await getCourierMe(app, await createCourier(app, db)).expect(HttpStatus.OK);
    userId = await findUserId(db, COURIER_ACCOUNT.email);
    profileId = await findCourierProfileId(db, COURIER_ACCOUNT.email);
  });

  afterAll(async () => {
    await app.close();
  });

  async function goOnShiftInFlight(tx: Transaction): Promise<void> {
    await tx
      .update(courierProfiles)
      .set({ isAvailable: true })
      .where(eq(courierProfiles.courierProfileId, profileId));
    await tx.insert(courierShifts).values({ courierId: profileId, startedAt: new Date() });
  }

  it.each([
    ['block', () => postBlock(app, admin, userId)],
    ['role change', () => postRole(app, admin, userId, { role: ROLE.MANAGER })],
  ])(
    'should wait for the shift being started and take the courier off it after the %s',
    async (_action, request) => {
      const response = await commitOnceBlocked(db, goOnShiftInFlight, request);

      expect(response.status).toBe(HttpStatus.OK);
      const [profile] = await db
        .select({ isAvailable: courierProfiles.isAvailable })
        .from(courierProfiles)
        .where(eq(courierProfiles.courierProfileId, profileId));
      const open = await db.select().from(courierShifts).where(isNull(courierShifts.endedAt));

      expect(profile.isAvailable).toBe(false);
      expect(open).toHaveLength(0);
    },
  );
});
