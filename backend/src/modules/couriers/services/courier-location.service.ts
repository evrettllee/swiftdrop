import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { isLockTimeout } from '../../../common/database/pg-errors';
import type { GeoPoint } from '../../../common/schemas/geo-point.schema';
import { describeError } from '../../../common/utils/describe-error';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { courierProfiles } from '../../../database/schema';
import { LOCATION_UPDATE_REJECTIONS } from '../constants/couriers-socket.constants';
import type { LocationAck } from '../types/couriers-socket.types';

@Injectable()
export class CourierLocationService {
  private readonly logger = new Logger(CourierLocationService.name);

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  // Saves the position of a courier on shift, returns false when the courier is off shift.
  // The shift check is part of the update, so a position never outlives going off shift.
  async save(courierProfileId: number, point: GeoPoint, at: Date): Promise<boolean> {
    const updated = await this.db
      .update(courierProfiles)
      .set({ currentLat: point.latitude, currentLng: point.longitude, locationUpdatedAt: at })
      .where(
        and(
          eq(courierProfiles.courierProfileId, courierProfileId),
          eq(courierProfiles.isAvailable, true),
        ),
      )
      .returning({ courierProfileId: courierProfiles.courierProfileId });

    return updated.length > 0;
  }

  // Saves the position and answers the socket: a failure is a refusal in the acknowledgement,
  // never an error the client does not wait for.
  async record(courierProfileId: number, point: GeoPoint, at: Date): Promise<LocationAck> {
    let ack: LocationAck = { ok: true };

    try {
      if (!(await this.save(courierProfileId, point, at))) {
        ack = { ok: false, reason: LOCATION_UPDATE_REJECTIONS.OFF_SHIFT };
      }
    } catch (error) {
      // Going on or off shift holds the profile row: the next position comes in 15 seconds anyway.
      ack = { ok: false, reason: LOCATION_UPDATE_REJECTIONS.BUSY };

      if (!isLockTimeout(error)) {
        this.logger.error(
          `Position of courier ${courierProfileId} not saved: ${describeError(error)}`,
        );
        ack = { ok: false, reason: LOCATION_UPDATE_REJECTIONS.UNAVAILABLE };
      }
    }

    return ack;
  }
}
