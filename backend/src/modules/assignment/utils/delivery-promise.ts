import { eq } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { MS_PER_MINUTE } from '@/common/constants/time.constants';
import type { Transaction } from '@/database/database.module';
import { orders } from '@/database/schema';
import { PICKUP_BUFFER_MINUTES } from '@/modules/pricing/constants/pricing.constants';
import {
  PROMISE_PICKUP_ALLOWANCE_MIN,
  PROMISE_ROUNDING_MIN,
} from '../constants/assignment.constants';

const ROUNDING_MS = PROMISE_ROUNDING_MIN * MS_PER_MINUTE;

export function promisedDeliveryAt(assignedAt: Date, estimatedMinutes: number | null): Date | null {
  if (estimatedMinutes === null) {
    return null;
  }

  const routeMinutes = Math.max(estimatedMinutes - PICKUP_BUFFER_MINUTES, 0);
  const promisedMs =
    assignedAt.getTime() + (routeMinutes + PROMISE_PICKUP_ALLOWANCE_MIN) * MS_PER_MINUTE;

  return new Date(Math.ceil(promisedMs / ROUNDING_MS) * ROUNDING_MS);
}

export async function firstPromiseChanges(
  tx: Transaction,
  orderId: number,
  assignedAt: Date,
): Promise<{ promisedDeliveryAt?: Date }> {
  const [order] = await tx
    .select({
      estimatedMinutes: orders.estimatedMinutes,
      promisedDeliveryAt: orders.promisedDeliveryAt,
    })
    .from(orders)
    .where(eq(orders.orderId, orderId))
    .limit(SINGLE_ROW_LIMIT);
  const promise =
    order && order.promisedDeliveryAt === null
      ? promisedDeliveryAt(assignedAt, order.estimatedMinutes)
      : null;

  return promise === null ? {} : { promisedDeliveryAt: promise };
}
