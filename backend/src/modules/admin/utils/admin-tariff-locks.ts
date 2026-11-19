import { ConflictException, NotFoundException } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { ROW_LOCK_UPDATE, SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import type { Transaction } from '@/database/database.module';
import { serviceZones, tariffs } from '@/database/schema';
import { ADMIN_TARIFF_MESSAGES as MESSAGES } from '../constants/admin-tariffs.constants';
import { TARIFF_ROW_COLUMNS } from './admin-tariff-queries';

export async function lockTariff(tx: Transaction, tariffId: number) {
  const [tariff] = await tx
    .select(TARIFF_ROW_COLUMNS)
    .from(tariffs)
    .where(eq(tariffs.tariffId, tariffId))
    .limit(SINGLE_ROW_LIMIT)
    .for(ROW_LOCK_UPDATE);

  if (!tariff) {
    throw new NotFoundException(MESSAGES.NOT_FOUND);
  }

  return tariff;
}

export async function ensureNoActiveZones(tx: Transaction, tariffId: number): Promise<void> {
  const zones = await tx
    .select({ name: serviceZones.name })
    .from(serviceZones)
    .where(and(eq(serviceZones.tariffId, tariffId), eq(serviceZones.isActive, true)))
    .orderBy(asc(serviceZones.name));

  if (zones.length > 0) {
    throw new ConflictException(
      MESSAGES.USED_BY_ZONES(zones.map((zone) => `«${zone.name}»`).join(', ')),
    );
  }
}
