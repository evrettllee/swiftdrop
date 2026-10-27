import { Logger } from '@nestjs/common';
import { DatabaseError } from 'pg';
import { PG_LOCK_NOT_AVAILABLE_CODE } from '@/common/constants/database.constants';
import type { Database } from '@/database/database.module';
import { LOCATION_UPDATE_REJECTIONS } from '../constants/courier-location.constants';
import { CourierLocationService } from './courier-location.service';

const COURIER_ID = 7;
const ORDER_ID = 42;
const POINT = { latitude: 53.9, longitude: 27.56 };
const SAVED_AT = new Date('2026-10-14T12:00:00Z');

function lockTimeout(): Error {
  const cause = new DatabaseError('lock timeout', 0, 'error');
  cause.code = PG_LOCK_NOT_AVAILABLE_CODE;

  return new Error('Failed query', { cause });
}

describe('CourierLocationService.record', () => {
  // The database is never reached: save() and refusalReason() are replaced in every test.
  const service = new CourierLocationService({} as Database);
  const save = jest.spyOn(service, 'save');
  const refusalReason = jest.spyOn(service, 'refusalReason');
  const logError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

  beforeEach(() => {
    save.mockReset();
    refusalReason.mockReset();
    logError.mockClear();
  });

  afterAll(() => {
    logError.mockRestore();
  });

  it('should acknowledge the position with no event when there is no active order', async () => {
    save.mockResolvedValue({ locationUpdatedAt: SAVED_AT, activeOrderId: null });

    await expect(service.record(COURIER_ID, POINT)).resolves.toEqual({
      ack: { ok: true },
      event: null,
    });
  });

  it('should give the event of the active order with the time of the database', async () => {
    save.mockResolvedValue({ locationUpdatedAt: SAVED_AT, activeOrderId: ORDER_ID });

    await expect(service.record(COURIER_ID, POINT)).resolves.toEqual({
      ack: { ok: true },
      event: { orderId: ORDER_ID, ...POINT, updatedAt: SAVED_AT.toISOString() },
    });
  });

  it.each([LOCATION_UPDATE_REJECTIONS.OFF_SHIFT, LOCATION_UPDATE_REJECTIONS.TOO_FREQUENT])(
    'should refuse the position with %s when the query keeps nothing',
    async (reason) => {
      save.mockResolvedValue(null);
      refusalReason.mockResolvedValue(reason);

      await expect(service.record(COURIER_ID, POINT)).resolves.toEqual({
        ack: { ok: false, reason },
        event: null,
      });
    },
  );

  it('should refuse the position as busy when the profile row is held', async () => {
    save.mockRejectedValue(lockTimeout());

    await expect(service.record(COURIER_ID, POINT)).resolves.toEqual({
      ack: { ok: false, reason: LOCATION_UPDATE_REJECTIONS.BUSY },
      event: null,
    });
    expect(logError).not.toHaveBeenCalled();
  });

  it('should log the failure and refuse the position when saving fails unexpectedly', async () => {
    save.mockRejectedValue(new Error('connection lost'));

    await expect(service.record(COURIER_ID, POINT)).resolves.toEqual({
      ack: { ok: false, reason: LOCATION_UPDATE_REJECTIONS.UNAVAILABLE },
      event: null,
    });
    expect(logError).toHaveBeenCalledTimes(1);
  });
});
