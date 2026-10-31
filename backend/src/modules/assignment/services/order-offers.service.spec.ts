import { Logger } from '@nestjs/common';
import { DatabaseError } from 'pg';
import {
  PG_DEADLOCK_DETECTED_CODE,
  PG_LOCK_NOT_AVAILABLE_CODE,
  PG_UNIQUE_VIOLATION_CODE,
} from '@/common/constants/database.constants';
import type { Database } from '@/database/database.module';
import type { CourierProfilesService } from '@/modules/couriers/services/courier-profiles.service';
import { OrderOffersService } from './order-offers.service';

const PLAN = { courierProfileId: 3, pickupEtaSec: 300, totalEtaSec: 1500 };

function failedQuery(code: string): Error {
  const cause = Object.assign(new DatabaseError('database error', 0, 'error'), { code });

  return new Error('Failed query', { cause });
}

function serviceFailingWith(error: Error): OrderOffersService {
  const db = { transaction: jest.fn(() => Promise.reject(error)) } as unknown as Database;

  return new OrderOffersService(db, {} as CourierProfilesService);
}

describe('OrderOffersService.create', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([PG_LOCK_NOT_AVAILABLE_CODE, PG_DEADLOCK_DETECTED_CODE])(
    'should open no offer and leave the order to the next round on a lock conflict %s',
    async (code) => {
      const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

      await expect(serviceFailingWith(failedQuery(code)).create(7, PLAN)).resolves.toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
    },
  );

  it('should pass any other failure through', async () => {
    const error = failedQuery(PG_UNIQUE_VIOLATION_CODE);

    await expect(serviceFailingWith(error).create(7, PLAN)).rejects.toBe(error);
  });
});
