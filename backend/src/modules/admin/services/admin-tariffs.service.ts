import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { ADMIN_TARIFF_MESSAGES } from '../constants/admin-tariffs.constants';
import type { AdminTariffItem, AdminTariffZone } from '../types/admin-tariffs.types';
import type { PersonName } from '../types/admin-users.types';
import {
  findLastTariffActors,
  findTariffRows,
  findTariffZones,
} from '../utils/admin-tariff-queries';

type TariffRow = Awaited<ReturnType<typeof findTariffRows>>[number];

function groupZones(
  rows: Awaited<ReturnType<typeof findTariffZones>>,
): Map<number, AdminTariffZone[]> {
  const byTariff = new Map<number, AdminTariffZone[]>();

  for (const { tariffId, zoneId, name, isActive } of rows) {
    byTariff.set(tariffId, [...(byTariff.get(tariffId) ?? []), { zoneId, name, isActive }]);
  }

  return byTariff;
}

function toItem(
  row: TariffRow,
  zones: AdminTariffZone[],
  updatedBy: PersonName | null,
): AdminTariffItem {
  return {
    tariffId: row.tariffId,
    name: row.name,
    pricePerKm: Number(row.pricePerKm),
    pricePerKg: Number(row.pricePerKg),
    minPrice: Number(row.minPrice),
    fragileFee: Number(row.fragileFee),
    isActive: row.isActive,
    zones,
    updatedAt: row.updatedAt,
    updatedBy,
  };
}

@Injectable()
export class AdminTariffsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async list(ids?: number[]): Promise<AdminTariffItem[]> {
    const [rows, zones, actors] = await Promise.all([
      findTariffRows(this.db, ids),
      findTariffZones(this.db, ids),
      findLastTariffActors(this.db, ids),
    ]);
    const zonesByTariff = groupZones(zones);
    const actorByTariff = new Map(
      actors.map((actor) => [
        actor.tariffId,
        { firstName: actor.firstName, lastName: actor.lastName },
      ]),
    );

    return rows.map((row) =>
      toItem(row, zonesByTariff.get(row.tariffId) ?? [], actorByTariff.get(row.tariffId) ?? null),
    );
  }

  async get(tariffId: number): Promise<AdminTariffItem> {
    const [item] = await this.list([tariffId]);

    if (!item) {
      throw new NotFoundException(ADMIN_TARIFF_MESSAGES.NOT_FOUND);
    }

    return item;
  }
}
