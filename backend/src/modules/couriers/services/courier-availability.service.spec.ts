import { ConflictException } from '@nestjs/common';
import type { Database, Transaction } from '@/database/database.module';
import { queueDatabase } from '@test/support/queue-database';
import { CourierAvailabilityService } from './courier-availability.service';
import type { CourierProfilesService } from './courier-profiles.service';
import { CourierShiftEventsService } from './courier-shift-events.service';

function setUp(wasAvailable: boolean, results: unknown[][], activeOrderId: number | null = null) {
  const fake = queueDatabase(results);
  const log: string[] = [];
  const db = {
    transaction: async <T>(work: (tx: Transaction) => Promise<T>) => {
      const result = await work(fake.tx);
      log.push('commit');

      return result;
    },
  } as unknown as Database;
  const profiles = {
    lockOwnProfile: jest.fn().mockResolvedValue({ courierProfileId: 5, isAvailable: wasAvailable }),
    findActiveOrderId: jest.fn().mockResolvedValue(activeOrderId),
    getMe: jest.fn().mockResolvedValue({}),
  };
  const shiftEvents = new CourierShiftEventsService();
  shiftEvents.subscribe((event) => log.push(`${event.courierProfileId} ${event.isAvailable}`));
  const service = new CourierAvailabilityService(
    db,
    profiles as unknown as CourierProfilesService,
    shiftEvents,
  );

  return { service, log, fake };
}

const methods = (fake: ReturnType<typeof queueDatabase>) => fake.calls.map((call) => call.method);

describe('CourierAvailabilityService shift events', () => {
  it('should announce going on shift after the commit', async () => {
    const { service, log } = setUp(false, [[{ vehicleId: 1 }], []]);

    await service.set(9, true);

    expect(log).toEqual(['commit', '5 true']);
  });

  it('should announce going off shift after the commit', async () => {
    const { service, log } = setUp(true, [[]]);

    await service.set(9, false);

    expect(log).toEqual(['commit', '5 false']);
  });

  it('should announce nothing when the shift does not change', async () => {
    const { service, log } = setUp(true, [[{ vehicleId: 1 }], []]);

    await service.set(9, true);

    expect(log).toEqual(['commit']);
  });

  it('should open a shift in the same transaction when the courier goes on the line', async () => {
    const { service, fake } = setUp(false, [[{ vehicleId: 1 }], []]);

    await service.set(9, true);

    const values = fake.calls.find((call) => call.method === 'values')?.args[0];
    expect(methods(fake)).toContain('insert');
    expect(methods(fake)).toContain('onConflictDoNothing');
    expect(values).toMatchObject({ courierId: 5 });
  });

  it('should close the open shift when the courier leaves the line', async () => {
    const { service, fake } = setUp(true, [[]]);

    await service.set(9, false);

    const sets = fake.calls.filter((call) => call.method === 'set').map((call) => call.args[0]);
    expect(methods(fake)).not.toContain('insert');
    expect(sets[1]).toHaveProperty('endedAt');
  });

  it('should open no second shift when the courier is already on the line', async () => {
    const { service, fake } = setUp(true, [[{ vehicleId: 1 }], []]);

    await service.set(9, true);

    expect(methods(fake)).not.toContain('insert');
  });

  it('should announce nothing when going off shift is refused for an active order', async () => {
    const { service, log } = setUp(true, [], 42);

    await expect(service.set(9, false)).rejects.toThrow(ConflictException);
    expect(log).toEqual([]);
  });
});
