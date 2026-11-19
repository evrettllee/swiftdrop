import type { NestExpressApplication } from '@nestjs/platform-express';
import { DatabaseError } from 'pg';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { tariffs } from '@/database/schema';
import { createTestApp } from '@test/support/app';
import { TEST_TARIFF } from '@test/support/constants';
import { resetTestData, seedServiceArea } from '@test/support/database';

function constraintOf(error: unknown): string | undefined {
  let current: unknown = error;

  while (current instanceof Error && !(current instanceof DatabaseError)) {
    current = current.cause;
  }

  return current instanceof DatabaseError ? current.constraint : undefined;
}

describe('Tariff constraints (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    await seedServiceArea(db);
  });

  afterAll(async () => {
    await app.close();
  });

  async function insertError(values: typeof tariffs.$inferInsert): Promise<string | undefined> {
    const error: unknown = await db
      .insert(tariffs)
      .values(values)
      .then(
        () => undefined,
        (reason: unknown) => reason,
      );

    return constraintOf(error);
  }

  it('should reject a tariff when its price per km is negative', async () => {
    await expect(
      insertError({ ...TEST_TARIFF, name: 'Negative', pricePerKm: '-1.00' }),
    ).resolves.toBe('tariffs_price_per_km_check');
  });

  it('should reject a tariff when its name differs from another only in case', async () => {
    await expect(
      insertError({ ...TEST_TARIFF, name: TEST_TARIFF.name.toUpperCase() }),
    ).resolves.toBe('tariffs_name_lower_uidx');
  });
});
