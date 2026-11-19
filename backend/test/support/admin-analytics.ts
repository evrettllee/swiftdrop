import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_FINISHED_STATUSES } from '@/common/constants/orders.constants';
import type { OrderOfferStatus } from '@/common/enums/order-offer-status.enum';
import { ORDER_STATUS, type OrderStatus } from '@/common/enums/order-status.enum';
import { PAYMENT_STATUS } from '@/common/enums/payment-status.enum';
import type { Database } from '@/database/database.module';
import { orders, orderStatusHistory } from '@/database/schema';
import { ADMIN_ANALYTICS_ROUTES } from '@/modules/admin/constants/admin-analytics.constants';
import { withCookies } from './admin';
import { orderFactsOf } from './order-facts';
import { insertAcceptedOffer, insertOffer } from './assignment';
import { getApi } from './http';
import { placeOrders } from './orders';
import { insertPayment } from './payments';

export type AnalyticsActors = {
  client: number;
  courier: number;
  courierProfile: number;
  manager: number;
};

type Actor = 'client' | 'courier' | 'manager' | 'system';

export type OrderPlan = {
  createdAt: string;
  status: OrderStatus;
  price?: string;
  finishedAt?: string;
  promisedAt?: string | null;
  zoneId?: number | null;
  steps?: [OrderStatus, string, Actor][];
  offers?: [OrderOfferStatus, string][];
  refundedAt?: string;
};

const DEFAULT_PRICE = '10.00';

function actorId(actor: Actor, actors: AnalyticsActors): number | null {
  return actor === 'system' ? null : actors[actor];
}

function finishedAtOf(plan: OrderPlan): string | undefined {
  const isFinished = (ORDER_FINISHED_STATUSES as readonly string[]).includes(plan.status);

  return plan.finishedAt ?? (isFinished ? (plan.steps?.at(-1)?.[1] ?? plan.createdAt) : undefined);
}

async function applyPlan(db: Database, orderId: number, plan: OrderPlan, actors: AnalyticsActors) {
  const assigned = plan.steps?.some(([status]) => status === ORDER_STATUS.COURIER_ASSIGNED);
  const finishedAt = finishedAtOf(plan);

  await db
    .update(orders)
    .set({
      status: plan.status,
      price: plan.price ?? DEFAULT_PRICE,
      createdAt: new Date(plan.createdAt),
      finishedAt: finishedAt ? new Date(finishedAt) : null,
      promisedDeliveryAt: plan.promisedAt ? new Date(plan.promisedAt) : null,
      courierId: assigned ? actors.courierProfile : null,
      ...orderFactsOf(plan.steps ?? [], 'courier'),
      ...(plan.zoneId === undefined ? {} : { zoneId: plan.zoneId }),
    })
    .where(eq(orders.orderId, orderId));

  for (const [status, at, actor] of plan.steps ?? []) {
    await db
      .insert(orderStatusHistory)
      .values({ orderId, status, changedBy: actorId(actor, actors), changedAt: new Date(at) });

    if (status === ORDER_STATUS.COURIER_ASSIGNED && actor === 'courier') {
      await insertAcceptedOffer(db, orderId, actors.courierProfile, new Date(at));
    }
  }

  for (const [index, [status, at]] of (plan.offers ?? []).entries()) {
    await insertOffer(db, orderId, actors.courierProfile, {
      status,
      round: index + 1,
      offeredAt: new Date(at),
      expiresAt: new Date(at),
    });
  }

  if (plan.refundedAt) {
    await insertPayment(db, orderId, {
      status: PAYMENT_STATUS.REFUNDED,
      amount: plan.price ?? DEFAULT_PRICE,
      paidAt: new Date(plan.createdAt),
      refundedAt: new Date(plan.refundedAt),
    });
  }
}

export async function buildOrders(
  app: NestExpressApplication,
  db: Database,
  clientCookies: string,
  actors: AnalyticsActors,
  plans: OrderPlan[],
): Promise<number[]> {
  const ids = await placeOrders(app, clientCookies, plans.length);

  for (const [index, plan] of plans.entries()) {
    await applyPlan(db, ids[index], plan, actors);
  }

  return ids;
}

export function getAdminAnalytics(
  app: NestExpressApplication,
  cookies: string | null,
  route: string,
  query: Record<string, string> = {},
) {
  return withCookies(getApi(app, `${ADMIN_ANALYTICS_ROUTES.BASE}/${route}`).query(query), cookies);
}
