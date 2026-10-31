import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, desc, eq } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { serviceZones, tariffs } from '@/database/schema';
import { MANAGER_ZONES_MESSAGES } from '../constants/manager-zones.constants';
import { toManagerZone, toManagerZoneDetails } from '../mappers/manager-zone.mapper';
import type {
  ManagerTariffOption,
  ManagerZone,
  ManagerZoneDetails,
} from '../types/manager-zones.types';

@Injectable()
export class ManagerZonesService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async list(): Promise<ManagerZone[]> {
    const rows = await this.zoneRows().orderBy(
      desc(serviceZones.isActive),
      desc(serviceZones.priority),
      asc(serviceZones.name),
      asc(serviceZones.zoneId),
    );

    return rows.map(toManagerZone);
  }

  async get(zoneId: number): Promise<ManagerZoneDetails> {
    const [row] = await this.zoneRows()
      .where(eq(serviceZones.zoneId, zoneId))
      .limit(SINGLE_ROW_LIMIT);

    if (!row) {
      throw new NotFoundException(MANAGER_ZONES_MESSAGES.ZONE_NOT_FOUND);
    }

    return toManagerZoneDetails(row);
  }

  tariffs(): Promise<ManagerTariffOption[]> {
    return this.db
      .select({ id: tariffs.tariffId, name: tariffs.name })
      .from(tariffs)
      .where(eq(tariffs.isActive, true))
      .orderBy(asc(tariffs.name), asc(tariffs.tariffId));
  }

  private zoneRows() {
    return this.db
      .select({
        zoneId: serviceZones.zoneId,
        name: serviceZones.name,
        tariffId: serviceZones.tariffId,
        tariffName: tariffs.name,
        priority: serviceZones.priority,
        isActive: serviceZones.isActive,
        polygon: serviceZones.polygon,
        updatedAt: serviceZones.updatedAt,
      })
      .from(serviceZones)
      .innerJoin(tariffs, eq(tariffs.tariffId, serviceZones.tariffId))
      .$dynamic();
  }
}
