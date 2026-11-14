import type { NestExpressApplication } from '@nestjs/platform-express';
import { asc } from 'drizzle-orm';
import { SERVICE_NAME } from '@/common/enums/service-name.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { serviceFailures } from '@/database/schema';
import { ServiceFailuresService } from '@/modules/service-failures/services/service-failures.service';
import { createTestApp } from '@test/support/app';
import { resetTestData } from '@test/support/database';

const AT = (time: string) => new Date(`2026-11-13T${time}Z`);

describe('Service failures writer (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let failures: ServiceFailuresService;

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get<Database>(DRIZZLE);
    failures = app.get(ServiceFailuresService);
  });

  beforeEach(async () => {
    await resetTestData(db);
  });

  afterAll(async () => {
    await app.close();
  });

  function readFailures() {
    return db.select().from(serviceFailures).orderBy(asc(serviceFailures.failureId));
  }

  it('should merge repeats within ten minutes and start a new row after', async () => {
    await failures.record(SERVICE_NAME.OSRM, 'ETIMEDOUT', 'Route timed out', AT('10:00:00'));
    await failures.record(SERVICE_NAME.OSRM, 'ETIMEDOUT', 'Route timed out', AT('10:06:00'));
    await failures.record(SERVICE_NAME.OSRM, 'ETIMEDOUT', 'Route timed out', AT('10:16:00'));
    await failures.record(SERVICE_NAME.OSRM, 'ETIMEDOUT', 'Route timed out', AT('10:26:30'));

    expect(await readFailures()).toEqual([
      expect.objectContaining({
        service: 'osrm',
        code: 'ETIMEDOUT',
        firstAt: AT('10:00:00'),
        lastAt: AT('10:16:00'),
        repeats: 3,
      }),
      expect.objectContaining({ firstAt: AT('10:26:30'), lastAt: AT('10:26:30'), repeats: 1 }),
    ]);
  });

  it('should keep other services and codes apart', async () => {
    await failures.record(SERVICE_NAME.OSRM, 'ETIMEDOUT', 'Route timed out', AT('10:00:00'));
    await failures.record(SERVICE_NAME.OSRM, 'HTTP_502', 'Bad gateway', AT('10:01:00'));
    await failures.record(SERVICE_NAME.NBRB, 'ETIMEDOUT', 'Rate timed out', AT('10:02:00'));

    expect((await readFailures()).map((row) => [row.service, row.code, row.repeats])).toEqual([
      ['osrm', 'ETIMEDOUT', 1],
      ['osrm', 'HTTP_502', 1],
      ['nbrb', 'ETIMEDOUT', 1],
    ]);
  });

  it('should merge every repeat that arrives at once into one row', async () => {
    await Promise.all(
      Array.from({ length: 5 }, () =>
        failures.record(SERVICE_NAME.MAIL, 'EAUTH', 'Login failed', AT('10:00:00')),
      ),
    );

    expect(await readFailures()).toEqual([expect.objectContaining({ repeats: 5 })]);
  });

  it('should cut long texts and never throw when the row cannot be written', async () => {
    await failures.record(SERVICE_NAME.SERVER, 'x'.repeat(80), 'я'.repeat(400), AT('10:00:00'));
    await expect(
      failures.record(SERVICE_NAME.SERVER, 'BAD', 'text with \u0000 inside', AT('10:00:00')),
    ).resolves.toBeUndefined();

    const rows = await readFailures();
    expect(rows).toHaveLength(1);
    expect(rows[0].code).toHaveLength(64);
    expect(rows[0].message).toHaveLength(300);
  });
});
