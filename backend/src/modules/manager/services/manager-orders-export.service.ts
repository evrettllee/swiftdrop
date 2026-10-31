import { HttpStatus, Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { and } from 'drizzle-orm';
import { APP_TIME_ZONE } from '@/common/constants/time.constants';
import { sortOrderBy } from '@/common/database/list-sort';
import { formatWallDate, wallClock } from '@/common/utils/wall-clock';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import {
  EXPORT_CONTENT_TYPE,
  EXPORT_FILE_PREFIX,
  EXPORT_FORMAT,
  EXPORT_TOO_LARGE_CODE,
  MANAGER_EXPORT_MESSAGES,
} from '../constants/manager-export.constants';
import type { ManagerOrdersExportDto } from '../dto/manager-orders-export.dto';
import type { ExportFile } from '../types/manager-export.types';
import { toCsv } from '../utils/export-csv';
import { buildExportTable } from '../utils/export-table';
import { toXlsx } from '../utils/export-xlsx';
import { findManagerExportRows } from '../utils/manager-export-query';
import { managerOrderConditions, statusGroupsCondition } from '../utils/manager-order-conditions';
import { countManagerOrders } from '../utils/manager-orders-count';
import { MANAGER_ORDERS_SORT } from '../utils/manager-orders-sort';
import { ManagerExportLimits } from './manager-export-limits';

@Injectable()
export class ManagerOrdersExportService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly limits: ManagerExportLimits,
  ) {}

  async export(query: ManagerOrdersExportDto, now: Date = new Date()): Promise<ExportFile> {
    const where = and(
      statusGroupsCondition(query.status),
      managerOrderConditions(this.db, query.filters),
    );
    const total = await countManagerOrders(this.db, where);

    if (total > this.limits.rowLimit) {
      throw new UnprocessableEntityException({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        code: EXPORT_TOO_LARGE_CODE,
        message: MANAGER_EXPORT_MESSAGES.TOO_LARGE,
        total,
      });
    }

    const field = MANAGER_ORDERS_SORT.whitelist[query.sort.key];
    const orderBy = sortOrderBy(field, MANAGER_ORDERS_SORT.idColumn, query.sort);
    const rows = await findManagerExportRows(this.db, where, orderBy, query.withPhones);
    const table = buildExportTable(rows, query.withPhones);
    const body = query.format === EXPORT_FORMAT.CSV ? toCsv(table) : await toXlsx(table);

    return {
      filename: `${EXPORT_FILE_PREFIX}-${formatWallDate(wallClock(now, APP_TIME_ZONE))}.${query.format}`,
      contentType: EXPORT_CONTENT_TYPE[query.format],
      body,
    };
  }
}
