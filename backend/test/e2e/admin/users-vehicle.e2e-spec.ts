import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ROLE } from '@/common/enums/role.enum';
import { VEHICLE_TYPE, type VehicleType } from '@/common/enums/vehicle-type.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { vehicles } from '@/database/schema';
import { ADMIN_USERS_VALIDATION_MESSAGES } from '@/modules/admin/constants/admin-users.constants';
import { createTestApp } from '@test/support/app';
import {
  type AdminListBody,
  createAdmin,
  emailsOf,
  getAdminUserCounts,
  getAdminUsers,
  insertUser,
} from '@test/support/admin';
import { insertCourier } from '@test/support/admin-analytics-blocks';
import { resetTestData } from '@test/support/database';

type ValidationBody = { errors: { field: string; message: string }[] };

describe('Admin users vehicle filter (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;

  async function insertCourierWith(email: string, type: VehicleType | null): Promise<void> {
    const courierProfileId = await insertCourier(db, { email });

    if (type !== null) {
      await db.insert(vehicles).values({ courierProfileId, type });
    }
  }

  async function list(query: Record<string, string>): Promise<AdminListBody> {
    return (await getAdminUsers(app, admin, query).expect(HttpStatus.OK)).body as AdminListBody;
  }

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    admin = await createAdmin(app, db);
    await insertCourierWith('foot@x.by', VEHICLE_TYPE.FOOT);
    await insertCourierWith('car@x.by', VEHICLE_TYPE.CAR);
    await insertCourierWith('truck@x.by', VEHICLE_TYPE.TRUCK);
    await insertCourierWith('novehicle@x.by', null);
    await insertUser(db, { role: ROLE.COURIER, email: 'noprofile@x.by' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should give only the couriers with the chosen vehicles', async () => {
    const body = await list({ role: ROLE.COURIER, vehicle: 'car,truck' });

    expect(emailsOf(body).sort()).toEqual(['car@x.by', 'truck@x.by']);
    expect(body.total).toBe(2);
  });

  it('should treat none as a courier without a vehicle or without a profile', async () => {
    const body = await list({ role: ROLE.COURIER, vehicle: 'none' });

    expect(emailsOf(body).sort()).toEqual(['noprofile@x.by', 'novehicle@x.by']);
  });

  it('should combine a vehicle with none', async () => {
    const body = await list({ role: ROLE.COURIER, vehicle: 'foot,none' });

    expect(emailsOf(body).sort()).toEqual(['foot@x.by', 'noprofile@x.by', 'novehicle@x.by']);
  });

  it('should refuse the vehicle filter on a tab other than couriers', async () => {
    for (const role of [ROLE.CLIENT, ROLE.MANAGER]) {
      const response = await getAdminUsers(app, admin, { role, vehicle: 'car' }).expect(
        HttpStatus.BAD_REQUEST,
      );

      expect((response.body as ValidationBody).errors).toContainEqual({
        field: 'vehicle',
        message: ADMIN_USERS_VALIDATION_MESSAGES.VEHICLE_COURIERS_ONLY,
      });
    }
  });

  it('should refuse an unknown vehicle', async () => {
    await getAdminUsers(app, admin, { role: ROLE.COURIER, vehicle: 'plane' }).expect(
      HttpStatus.BAD_REQUEST,
    );
  });

  it('should not take the vehicle filter in the counts', async () => {
    await getAdminUserCounts(app, admin, { vehicle: 'car' }).expect(HttpStatus.BAD_REQUEST);
  });
});
