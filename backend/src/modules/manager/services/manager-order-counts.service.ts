import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, inArray, lte, sql } from 'drizzle-orm';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders, packages } from '@/database/schema';
import {
  MANAGER_STATUS_GROUP,
  MANAGER_STATUS_GROUP_STATUSES,
  type ManagerStatusGroup,
} from '../constants/manager-orders.constants';
import type { ManagerOrderCountsDto } from '../dto/manager-orders.dto';
import type { ManagerOrderCounts } from '../types/manager-orders.types';
import { managerOrderConditions } from '../utils/manager-order-conditions';

function groupCount(group: ManagerStatusGroup) {
  const inGroup = inArray(orders.status, [...MANAGER_STATUS_GROUP_STATUSES[group]]);

  return sql<number>`count(*) FILTER (WHERE ${inGroup})`.mapWith(Number);
}

@Injectable()
export class ManagerOrderCountsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async count(query: ManagerOrderCountsDto): Promise<ManagerOrderCounts> {
    const [row] = await this.db
      .select({
        attention: groupCount(MANAGER_STATUS_GROUP.ATTENTION),
        active: groupCount(MANAGER_STATUS_GROUP.ACTIVE),
        awaitingPayment: groupCount(MANAGER_STATUS_GROUP.AWAITING_PAYMENT),
        finished: groupCount(MANAGER_STATUS_GROUP.FINISHED),
        cancelled: groupCount(MANAGER_STATUS_GROUP.CANCELLED),
        all: count(),
      })
      .from(orders)
      .innerJoin(packages, eq(packages.orderId, orders.orderId))
      .where(
        and(
          managerOrderConditions(this.db, query.filters),
          query.until === null ? undefined : lte(orders.orderId, query.until),
        ),
      );

    return (
      row ?? { attention: 0, active: 0, awaitingPayment: 0, finished: 0, cancelled: 0, all: 0 }
    );
  }
}
