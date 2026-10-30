import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { SERVICE_ZONES_NAME_INDEX } from '@/common/constants/database.constants';
import { withLockConflict } from '@/common/database/lock-conflict';
import { getUniqueViolationConstraint } from '@/common/database/pg-errors';
import { DRIZZLE } from '@/database/database.constants';
import type { Database, Transaction } from '@/database/database.module';
import { serviceZones } from '@/database/schema';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import { RealtimeEventsService } from '@/modules/realtime/services/realtime-events.service';
import type { StaffZoneEvent } from '@/modules/realtime/types/realtime.types';
import {
  MANAGER_ZONES_MESSAGES as MESSAGES,
  ZONE_ERROR_CODE,
  ZONES_WRITE_LOCK_KEY,
} from '../constants/manager-zones.constants';
import type { CreateZoneDto, UpdateZoneDto } from '../dto/manager-zones.dto';
import type { ManagerZoneDetails } from '../types/manager-zones.types';
import {
  checkedPolygon,
  ensureActiveTariff,
  hasOtherActiveZone,
  lockZone,
  zoneConflict,
} from '../utils/manager-zone-checks';
import { ManagerZonesService } from './manager-zones.service';

const NEXT_UPDATED_AT = sql`date_trunc('milliseconds', greatest(clock_timestamp(), ${serviceZones.updatedAt} + interval '1 millisecond'))`;

@Injectable()
export class ManagerZoneWritesService {
  private readonly logger = new Logger(ManagerZoneWritesService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly zones: ManagerZonesService,
    private readonly events: RealtimeEventsService,
  ) {}

  async create(dto: CreateZoneDto): Promise<ManagerZoneDetails> {
    const polygon = checkedPolygon(dto.polygon);
    const zoneId = await this.run(async (tx) => {
      await ensureActiveTariff(tx, dto.tariffId);
      const [zone] = await tx
        .insert(serviceZones)
        .values({ ...dto, polygon })
        .returning({ zoneId: serviceZones.zoneId });

      return zone.zoneId;
    });

    return this.announce(zoneId);
  }

  async update(zoneId: number, dto: UpdateZoneDto): Promise<ManagerZoneDetails> {
    const { expectedUpdatedAt, ...changes } = dto;
    const polygon = changes.polygon === undefined ? undefined : checkedPolygon(changes.polygon);

    await this.run(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(${ZONES_WRITE_LOCK_KEY})`);
      const zone = await lockZone(tx, zoneId);

      if (zone.updatedAt.getTime() !== new Date(expectedUpdatedAt).getTime()) {
        throw zoneConflict(ZONE_ERROR_CODE.ZONE_CHANGED, MESSAGES.ZONE_CHANGED, {
          updatedAt: zone.updatedAt.toISOString(),
        });
      }

      if (changes.tariffId !== undefined) {
        await ensureActiveTariff(tx, changes.tariffId);
      }

      if (changes.isActive === false && zone.isActive && !(await hasOtherActiveZone(tx, zoneId))) {
        throw zoneConflict(ZONE_ERROR_CODE.LAST_ACTIVE_ZONE, MESSAGES.LAST_ACTIVE_ZONE);
      }

      await tx
        .update(serviceZones)
        .set({ ...changes, ...(polygon && { polygon }), updatedAt: NEXT_UPDATED_AT })
        .where(eq(serviceZones.zoneId, zoneId));
    });

    return this.announce(zoneId);
  }

  private async run<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
    try {
      return await withLockConflict(() => this.db.transaction(work), MESSAGES.BUSY);
    } catch (error) {
      if (getUniqueViolationConstraint(error) === SERVICE_ZONES_NAME_INDEX) {
        throw zoneConflict(ZONE_ERROR_CODE.ZONE_NAME_TAKEN, MESSAGES.ZONE_NAME_TAKEN);
      }

      throw error;
    }
  }

  private announce(zoneId: number): Promise<ManagerZoneDetails> {
    const event: StaffZoneEvent = { zoneId };

    this.events.toStaff(SOCKET_EVENTS.STAFF_ZONE, event);
    this.logger.log(`Zone ${zoneId} saved`);

    return this.zones.get(zoneId);
  }
}
