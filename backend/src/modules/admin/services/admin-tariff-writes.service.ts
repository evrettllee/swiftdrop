import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { withLockConflict } from '@/common/database/lock-conflict';
import { getUniqueViolationConstraint } from '@/common/database/pg-errors';
import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database, Transaction } from '@/database/database.module';
import { tariffs } from '@/database/schema';
import {
  ADMIN_TARIFF_LOG_MESSAGES as LOG,
  ADMIN_TARIFF_MESSAGES as MESSAGES,
  TARIFF_FIELDS,
  TARIFF_NAME_INDEX,
} from '../constants/admin-tariffs.constants';
import type { CreateTariffDto, UpdateTariffDto } from '../dto/admin-tariffs.dto';
import type { AdminTariffItem } from '../types/admin-tariffs.types';
import { recordTariffAction } from '../utils/admin-action-log';
import { ensureNoActiveZones, lockTariff } from '../utils/admin-tariff-locks';
import { AdminTariffsService } from './admin-tariffs.service';

type TariffField = (typeof TARIFF_FIELDS)[number];

@Injectable()
export class AdminTariffWritesService {
  private readonly logger = new Logger(AdminTariffWritesService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly tariffList: AdminTariffsService,
  ) {}

  async create(adminId: number, dto: CreateTariffDto): Promise<AdminTariffItem> {
    const tariffId = await this.run(async (tx) => {
      const [created] = await tx
        .insert(tariffs)
        .values({ ...dto, isActive: true })
        .returning({ tariffId: tariffs.tariffId });

      await recordTariffAction(tx, {
        actorId: adminId,
        tariffId: created.tariffId,
        action: ADMIN_ACTION.TARIFF_CREATED,
        details: {},
      });

      return created.tariffId;
    });

    this.logger.log(`${LOG.CREATED}: tariff ${tariffId}`);

    return this.tariffList.get(tariffId);
  }

  async update(adminId: number, tariffId: number, dto: UpdateTariffDto): Promise<AdminTariffItem> {
    await this.run(async (tx) => {
      const tariff = await lockTariff(tx, tariffId);
      const fields = TARIFF_FIELDS.filter(
        (field) => dto[field] !== undefined && dto[field] !== tariff[field],
      );

      if (fields.length === 0) {
        return;
      }

      const changes: Partial<Record<TariffField, string>> = {};

      for (const field of fields) {
        changes[field] = dto[field];
      }

      await tx
        .update(tariffs)
        .set({ ...changes, updatedAt: new Date() })
        .where(eq(tariffs.tariffId, tariffId));
      await recordTariffAction(tx, {
        actorId: adminId,
        tariffId,
        action: ADMIN_ACTION.TARIFF_UPDATED,
        details: { fields },
      });
      this.logger.log(`${LOG.UPDATED}: tariff ${tariffId}, ${fields.join(', ')}`);
    });

    return this.tariffList.get(tariffId);
  }

  async setActive(adminId: number, tariffId: number, isActive: boolean): Promise<AdminTariffItem> {
    await this.run(async (tx) => {
      const tariff = await lockTariff(tx, tariffId);

      if (tariff.isActive === isActive) {
        return;
      }

      if (!isActive) {
        await ensureNoActiveZones(tx, tariffId);
      }

      await tx
        .update(tariffs)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(tariffs.tariffId, tariffId));
      await recordTariffAction(tx, {
        actorId: adminId,
        tariffId,
        action: isActive ? ADMIN_ACTION.TARIFF_ENABLED : ADMIN_ACTION.TARIFF_DISABLED,
        details: {},
      });
      this.logger.log(`${LOG.STATUS_CHANGED}: tariff ${tariffId}, active ${isActive}`);
    });

    return this.tariffList.get(tariffId);
  }

  private async run<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
    try {
      return await withLockConflict(() => this.db.transaction(work), MESSAGES.BUSY);
    } catch (error) {
      if (getUniqueViolationConstraint(error) === TARIFF_NAME_INDEX) {
        throw new ConflictException(MESSAGES.NAME_TAKEN);
      }

      throw error;
    }
  }
}
