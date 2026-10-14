import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { GeoPoint } from '../../../common/schemas/geo-point.schema';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { courierProfiles } from '../../../database/schema';

@Injectable()
export class CourierLocationService {
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
}
