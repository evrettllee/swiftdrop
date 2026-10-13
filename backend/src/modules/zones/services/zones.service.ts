import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { GeoPoint } from '../../../common/schemas/geo-point.schema';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { serviceZones, tariffs } from '../../../database/schema';
import type { ServiceZoneMatch } from '../types/zones.types';
import { selectZoneForPoint } from '../utils/zone-selection';

@Injectable()
export class ZonesService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findZoneForPoint(point: GeoPoint): Promise<ServiceZoneMatch | null> {
    const candidates = await this.db
      .select({
        zoneId: serviceZones.zoneId,
        name: serviceZones.name,
        tariffId: serviceZones.tariffId,
        priority: serviceZones.priority,
        polygon: serviceZones.polygon,
      })
      .from(serviceZones)
      .innerJoin(tariffs, eq(serviceZones.tariffId, tariffs.tariffId))
      .where(and(eq(serviceZones.isActive, true), eq(tariffs.isActive, true)));

    return selectZoneForPoint(candidates, point);
  }
}
