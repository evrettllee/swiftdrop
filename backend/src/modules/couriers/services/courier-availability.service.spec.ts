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

  return { service, log };
}

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

  it('should announce nothing when going off shift is refused for an active order', async () => {
    const { service, log } = setUp(true, [], 42);

    await expect(service.set(9, false)).rejects.toThrow(ConflictException);
    expect(log).toEqual([]);
  });
});
