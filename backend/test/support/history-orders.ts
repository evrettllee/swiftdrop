import { eq } from 'drizzle-orm';
import { ORDER_STATUS, type OrderStatus } from '@/common/enums/order-status.enum';
import type { Database } from '@/database/database.module';
import { orders, orderStatusHistory } from '@/database/schema';
import { COURIER_ORDERS_ROUTES } from '@/modules/deliveries/constants/deliveries.constants';
import { ORDER_ID_ROUTE_PARAM } from '@/modules/orders/constants/orders.constants';
import { assignOrder } from './couriers';
import { statusChange } from './order-status';

// The stages a courier went through before the end of an order, oldest first.
export const COURIER_STAGES: readonly OrderStatus[] = [
  ORDER_STATUS.COURIER_ASSIGNED,
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.IN_TRANSIT,
];
const STAGE_STEP_MS = 60_000;

// The path of a finished order of the courier; `orderId` may be anything an address can hold.
export function historyOrderPath(orderId: number | string): string {
  const path = COURIER_ORDERS_ROUTES.ORDER.replace(ORDER_ID_ROUTE_PARAM, String(orderId));

  return `${COURIER_ORDERS_ROUTES.BASE}/${path}`;
}

export function historyOrderRoutePath(orderId: number): string {
  const path = COURIER_ORDERS_ROUTES.ORDER_ROUTE.replace(ORDER_ID_ROUTE_PARAM, String(orderId));

  return `${COURIER_ORDERS_ROUTES.BASE}/${path}`;
}

// The order goes through the stages of the courier and ends with `status`, each stage written to
// its history one minute after the other, as the backend would.
export async function finishOrder(
  db: Database,
  orderId: number,
  courierProfileId: number,
  status: OrderStatus,
): Promise<void> {
  await assignOrder(db, orderId, courierProfileId, status);
  const start = Date.now() - (COURIER_STAGES.length + 1) * STAGE_STEP_MS;
  const stages = [...COURIER_STAGES, status].map((stage, index) => ({
    orderId,
    status: stage,
    changedBy: null,
    changedAt: new Date(start + index * STAGE_STEP_MS),
  }));

  await db.insert(orderStatusHistory).values(stages);
  await db
    .update(orders)
    .set(statusChange(status, stages[stages.length - 1].changedAt))
    .where(eq(orders.orderId, orderId));
}
