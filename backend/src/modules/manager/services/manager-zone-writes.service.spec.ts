import type { HttpException } from '@nestjs/common';
import { DatabaseError } from 'pg';
import type { Database, Transaction } from '@/database/database.module';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import { staffZoneEventSchema } from '@/modules/realtime/dto/staff-zone-event.dto';
import type { RealtimeEventsService } from '@/modules/realtime/services/realtime-events.service';
import { queueDatabase } from '@test/support/queue-database';
import { ManagerZoneWritesService } from './manager-zone-writes.service';
import type { ManagerZonesService } from './manager-zones.service';

const UPDATED_AT = new Date('2026-10-30T10:00:00.123Z');
const RECTANGLE: [number, number][] = [
  [27.4, 53.85],
  [27.7, 53.85],
  [27.7, 53.95],
  [27.4, 53.95],
];
const EXPECTED = { expectedUpdatedAt: UPDATED_AT.toISOString() };
const LOCKED = [{ isActive: true, updatedAt: UPDATED_AT }];

function setUp(results: unknown[][], failure?: Error) {
  const fake = queueDatabase(results);
  const log: string[] = [];
  const db = {
    transaction: async <T>(work: (tx: Transaction) => Promise<T>) => {
      const result = await work(fake.tx);

      if (failure) {
        throw failure;
      }

      log.push('commit');

      return result;
    },
  } as unknown as Database;
  const toStaff = jest.fn((...args: unknown[]) => log.push(String(args[0])));
  const get = jest.fn().mockResolvedValue({ id: 5 });
  const service = new ManagerZoneWritesService(
    db,
    { get } as unknown as ManagerZonesService,
    { toStaff } as unknown as RealtimeEventsService,
  );

  return { service, fake, log, toStaff };
}

const failureOf = async (promise: Promise<unknown>) =>
  ((await promise.catch((caught: unknown) => caught)) as HttpException).getResponse();

describe('ManagerZoneWritesService', () => {
  it('should save the change, then tell the staff after the commit', async () => {
    const { service, fake, log, toStaff } = setUp([[], LOCKED, [{ tariffId: 2 }], []]);

    await service.update(5, { ...EXPECTED, tariffId: 2, polygon: [RECTANGLE] });

    const set = fake.calls.find((call) => call.method === 'set')?.args[0];
    expect(set).toMatchObject({ tariffId: 2, polygon: [[...RECTANGLE, RECTANGLE[0]]] });
    expect(set).toHaveProperty('updatedAt');
    expect(log).toEqual(['commit', SOCKET_EVENTS.STAFF_ZONE]);
    expect(staffZoneEventSchema.safeParse(toStaff.mock.calls[0][1]).success).toBe(true);
  });

  it('should refuse a stale change with ZONE_CHANGED and the current time', async () => {
    const { service, log } = setUp([[], [{ isActive: true, updatedAt: new Date(0) }]]);

    expect(await failureOf(service.update(5, { ...EXPECTED, priority: 10 }))).toMatchObject({
      statusCode: 409,
      code: 'ZONE_CHANGED',
      updatedAt: new Date(0).toISOString(),
    });
    expect(log).toEqual([]);
  });

  it('should refuse an unknown or switched off tariff with TARIFF_NOT_FOUND', async () => {
    const { service } = setUp([[], LOCKED, []]);

    expect(await failureOf(service.update(5, { ...EXPECTED, tariffId: 9 }))).toMatchObject({
      statusCode: 422,
      code: 'TARIFF_NOT_FOUND',
    });
  });

  it('should refuse to switch off the last active zone', async () => {
    const { service, log } = setUp([[], LOCKED, [{ total: 0 }]]);

    expect(await failureOf(service.update(5, { ...EXPECTED, isActive: false }))).toMatchObject({
      statusCode: 409,
      code: 'LAST_ACTIVE_ZONE',
    });
    expect(log).toEqual([]);
  });

  it('should switch off a zone while another one stays active', async () => {
    const { service, log } = setUp([[], LOCKED, [{ total: 1 }], []]);

    await service.update(5, { ...EXPECTED, isActive: false });

    expect(log).toEqual(['commit', SOCKET_EVENTS.STAFF_ZONE]);
  });

  it('should refuse a taken name with ZONE_NAME_TAKEN', async () => {
    const violation = Object.assign(new DatabaseError('duplicate key', 0, 'error'), {
      code: '23505',
      constraint: 'service_zones_name_lower_uidx',
    });
    const { service } = setUp([[{ tariffId: 2 }], [{ zoneId: 5 }]], violation);

    expect(
      await failureOf(
        service.create({
          name: 'Центр',
          polygon: [RECTANGLE],
          tariffId: 2,
          priority: 0,
          isActive: true,
        }),
      ),
    ).toMatchObject({ statusCode: 409, code: 'ZONE_NAME_TAKEN' });
  });

  it('should refuse a bad polygon with INVALID_POLYGON before the transaction', async () => {
    const { service, fake } = setUp([]);

    expect(
      await failureOf(service.update(5, { ...EXPECTED, polygon: [RECTANGLE.slice(0, 2)] })),
    ).toMatchObject({ statusCode: 400, code: 'INVALID_POLYGON', reason: 'too_few_points' });
    expect(fake.calls).toEqual([]);
  });

  it('should tell nobody when the transaction rolls back', async () => {
    const { service, toStaff } = setUp([[], LOCKED, []], new Error('rolled back'));

    await expect(service.update(5, { ...EXPECTED, priority: 10 })).rejects.toThrow('rolled back');
    expect(toStaff).not.toHaveBeenCalled();
  });
});
