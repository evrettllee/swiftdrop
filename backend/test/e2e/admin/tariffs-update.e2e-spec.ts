import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { ADMIN_TARIFF_MESSAGES } from '@/modules/admin/constants/admin-tariffs.constants';
import { createTestApp } from '@test/support/app';
import { createAdmin } from '@test/support/admin';
import {
  findTariffActions,
  findTariffId,
  insertTariff,
  patchTariff,
} from '@test/support/admin-tariffs';
import { registerUser } from '@test/support/auth';
import { TEST_TARIFF } from '@test/support/constants';
import { placeOrders } from '@test/support/orders';
import { postEstimate, resetServiceArea, validEstimate } from '@test/support/pricing';

describe('Admin tariff update (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  let tariffId: number;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    admin = await createAdmin(app, db);
    tariffId = await findTariffId(db);
  });

  afterAll(async () => {
    await app.close();
  });

  async function quotedPrice(): Promise<number> {
    const response = await postEstimate(app, validEstimate).expect(HttpStatus.OK);

    return response.body.price;
  }

  it('should save only the changed fields and log their names', async () => {
    const response = await patchTariff(app, admin, tariffId, {
      name: TEST_TARIFF.name,
      pricePerKm: 1,
      minPrice: 6.5,
      fragileFee: 2.75,
    }).expect(HttpStatus.OK);

    expect(response.body).toMatchObject({ minPrice: 6.5, fragileFee: 2.75, pricePerKm: 1 });
    expect(await findTariffActions(db, tariffId)).toEqual([
      { action: ADMIN_ACTION.TARIFF_UPDATED, details: { fields: ['minPrice', 'fragileFee'] } },
    ]);
  });

  it('should write nothing when nothing changes', async () => {
    const before = await patchTariff(app, admin, tariffId, { pricePerKg: 0.5 }).expect(
      HttpStatus.OK,
    );

    expect(before.body.updatedBy).toBeNull();
    expect(await findTariffActions(db, tariffId)).toEqual([]);
  });

  it('should price the next quote with the new rate and keep the price of a placed order', async () => {
    const [orderId] = await placeOrders(app, (await registerUser(app)).cookies, 1);
    const [placed] = await db.select().from(orders).where(eq(orders.orderId, orderId));
    const oldQuote = await quotedPrice();

    await patchTariff(app, admin, tariffId, { pricePerKm: 2, minPrice: 50 }).expect(HttpStatus.OK);

    const newQuote = await quotedPrice();
    const [kept] = await db.select().from(orders).where(eq(orders.orderId, orderId));
    expect(newQuote).toBeGreaterThan(oldQuote);
    expect(newQuote).toBeGreaterThanOrEqual(50);
    expect(kept.price).toBe(placed.price);
  });

  it('should answer 400 for an empty body and 404 for an unknown tariff', async () => {
    const empty = await patchTariff(app, admin, tariffId, {}).expect(HttpStatus.BAD_REQUEST);
    const unknown = await patchTariff(app, admin, 999_999, { minPrice: 6 }).expect(
      HttpStatus.NOT_FOUND,
    );

    expect(empty.body.errors).toEqual([
      { field: '', message: ADMIN_TARIFF_MESSAGES.NOTHING_TO_UPDATE },
    ]);
    expect(unknown.body.message).toBe(ADMIN_TARIFF_MESSAGES.NOT_FOUND);
  });

  it('should answer 409 when the new name is taken by another tariff', async () => {
    await patchTariff(app, admin, tariffId, { name: 'Экспресс' }).expect(HttpStatus.OK);
    const second = await insertTariff(db, 'Бизнес');

    const response = await patchTariff(app, admin, second, {
      name: 'ЭКСПРЕСС',
    }).expect(HttpStatus.CONFLICT);

    expect(response.body.message).toBe(ADMIN_TARIFF_MESSAGES.NAME_TAKEN);
  });
});
