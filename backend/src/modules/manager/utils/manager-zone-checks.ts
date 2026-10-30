import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { and, count, eq, ne } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import type { Transaction } from '@/database/database.module';
import { serviceZones, tariffs } from '@/database/schema';
import { checkZonePolygon } from '@/modules/zones/utils/zone-polygon';
import {
  MANAGER_ZONES_MESSAGES as MESSAGES,
  ZONE_ERROR_CODE,
  ZONE_POLYGON_MESSAGES,
} from '../constants/manager-zones.constants';

const ROW_LOCK_UPDATE = 'update';

export function checkedPolygon(polygon: number[][][]): number[][][] {
  const result = checkZonePolygon(polygon);

  if (!result.ok) {
    throw new BadRequestException({
      statusCode: HttpStatus.BAD_REQUEST,
      code: ZONE_ERROR_CODE.INVALID_POLYGON,
      reason: result.reason,
      message: ZONE_POLYGON_MESSAGES[result.reason],
    });
  }

  return result.polygon;
}

export function zoneConflict(code: string, message: string, extra: object = {}): ConflictException {
  return new ConflictException({ statusCode: HttpStatus.CONFLICT, code, message, ...extra });
}

export async function lockZone(tx: Transaction, zoneId: number) {
  const [zone] = await tx
    .select({ isActive: serviceZones.isActive, updatedAt: serviceZones.updatedAt })
    .from(serviceZones)
    .where(eq(serviceZones.zoneId, zoneId))
    .limit(SINGLE_ROW_LIMIT)
    .for(ROW_LOCK_UPDATE);

  if (!zone) {
    throw new NotFoundException(MESSAGES.ZONE_NOT_FOUND);
  }

  return zone;
}

export async function ensureActiveTariff(tx: Transaction, tariffId: number): Promise<void> {
  const [tariff] = await tx
    .select({ tariffId: tariffs.tariffId })
    .from(tariffs)
    .where(and(eq(tariffs.tariffId, tariffId), eq(tariffs.isActive, true)))
    .limit(SINGLE_ROW_LIMIT);

  if (!tariff) {
    throw new UnprocessableEntityException({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      code: ZONE_ERROR_CODE.TARIFF_NOT_FOUND,
      message: MESSAGES.TARIFF_NOT_FOUND,
    });
  }
}

export async function hasOtherActiveZone(tx: Transaction, zoneId: number): Promise<boolean> {
  const [row] = await tx
    .select({ total: count() })
    .from(serviceZones)
    .where(and(eq(serviceZones.isActive, true), ne(serviceZones.zoneId, zoneId)));

  return (row?.total ?? 0) > 0;
}
