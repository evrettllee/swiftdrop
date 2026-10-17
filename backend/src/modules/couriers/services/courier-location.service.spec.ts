import { Logger } from '@nestjs/common';
import { DatabaseError } from 'pg';
import { PG_LOCK_NOT_AVAILABLE_CODE } from '../../../common/constants/database.constants';
import type { Database } from '../../../database/database.module';
import { LOCATION_UPDATE_REJECTIONS } from '../constants/couriers-socket.constants';
import { CourierLocationService } from './courier-location.service';

const COURIER_ID = 7;
const POINT = { latitude: 53.9, longitude: 27.56 };
const AT = new Date('2026-10-14T12:00:00Z');

function lockTimeout(): Error {
  const cause = new DatabaseError('lock timeout', 0, 'error');
  cause.code = PG_LOCK_NOT_AVAILABLE_CODE;

  return new Error('Failed query', { cause });
}

describe('CourierLocationService.record', () => {
  // The database is never reached: save() is replaced in every test.
  const service = new CourierLocationService({} as Database);
  const save = jest.spyOn(service, 'save');
  const logError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

  beforeEach(() => {
    save.mockReset();
    logError.mockClear();
  });

  afterAll(() => {
    logError.mockRestore();
  });

  it('should acknowledge the position when it is saved', async () => {
    save.mockResolvedValue(true);

    await expect(service.record(COURIER_ID, POINT, AT)).resolves.toEqual({ ok: true });
  });

  it('should refuse the position when the courier is off shift', async () => {
    save.mockResolvedValue(false);

    await expect(service.record(COURIER_ID, POINT, AT)).resolves.toEqual({
      ok: false,
      reason: LOCATION_UPDATE_REJECTIONS.OFF_SHIFT,
    });
  });

  it('should refuse the position as busy when the profile row is held', async () => {
    save.mockRejectedValue(lockTimeout());

    await expect(service.record(COURIER_ID, POINT, AT)).resolves.toEqual({
      ok: false,
      reason: LOCATION_UPDATE_REJECTIONS.BUSY,
    });
    expect(logError).not.toHaveBeenCalled();
  });

  it('should log the failure and refuse the position when saving fails unexpectedly', async () => {
    save.mockRejectedValue(new Error('connection lost'));

    await expect(service.record(COURIER_ID, POINT, AT)).resolves.toEqual({
      ok: false,
      reason: LOCATION_UPDATE_REJECTIONS.UNAVAILABLE,
    });
    expect(logError).toHaveBeenCalledTimes(1);
  });
});
