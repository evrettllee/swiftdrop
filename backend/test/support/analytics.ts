import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_OFFER_STATUS, type OrderOfferStatus } from '@/common/enums/order-offer-status.enum';
import { PAYMENT_STATUS } from '@/common/enums/payment-status.enum';
import type { Database } from '@/database/database.module';
import { courierShifts, orders, orderStatusHistory, users } from '@/database/schema';
import { MANAGER_ANALYTICS_ROUTES } from '@/modules/manager/constants/manager-analytics.constants';
import {
  ANALYTICS_ESTIMATED_MINUTES,
  ANALYTICS_PLANS,
  type AnalyticsActor,
  type AnalyticsPlan,
} from './analytics-plans';
import { insertOffer } from './assignment';
import { COOKIE_HEADER, registerUser } from './auth';
import {
  CAR,
  COURIER_ACCOUNT,
  createCourier,
  findCourierProfileId,
  getCourierMe,
  placeCourierAt,
  putVehicle,
  SECOND_COURIER_ACCOUNT,
} from './couriers';
import { MINSK_PICKUP } from './fixtures';
import { getApi } from './http';
import { placeOrders } from './orders';
import { insertPayment } from './payments';
import { MANAGER_ACCOUNT } from './users';

export const ANALYTICS_PERIOD_QUERY = { from: '2026-10-01', to: '2026-10-07' };

const IDLE_COURIER = { ...COURIER_ACCOUNT, email: 'idle@example.com', phone: '+375337778899' };

export type AnalyticsCouriers = { first: number; second: number; idle: number };

async function userIdOf(db: Database, email: string): Promise<number> {
  const [user] = await db
    .select({ userId: users.userId })
    .from(users)
    .where(eq(users.email, email));

  return user.userId;
}

async function seedCouriers(app: NestExpressApplication, db: Database): Promise<AnalyticsCouriers> {
  const firstCookies = await createCourier(app, db, COURIER_ACCOUNT);
  await putVehicle(app, firstCookies, CAR).expect(HttpStatus.OK);
  await getCourierMe(app, await createCourier(app, db, SECOND_COURIER_ACCOUNT)).expect(
    HttpStatus.OK,
  );
  await getCourierMe(app, await createCourier(app, db, IDLE_COURIER)).expect(HttpStatus.OK);

  return {
    first: await findCourierProfileId(db, COURIER_ACCOUNT.email),
    second: await findCourierProfileId(db, SECOND_COURIER_ACCOUNT.email),
    idle: await findCourierProfileId(db, IDLE_COURIER.email),
  };
}

async function seedOffersAndShifts(db: Database, couriers: AnalyticsCouriers, orderId: number) {
  const offer = (status: OrderOfferStatus, offeredAt: string, round: number) =>
    insertOffer(db, orderId, couriers.first, {
      status,
      round,
      offeredAt: new Date(offeredAt),
      expiresAt: new Date(offeredAt),
    });
  const shift = (courierId: number, startedAt: string, endedAt: string | null) => ({
    courierId,
    startedAt: new Date(startedAt),
    endedAt: endedAt === null ? null : new Date(endedAt),
  });

  await offer(ORDER_OFFER_STATUS.DECLINED, '2026-10-02T08:00:00Z', 1);
  await offer(ORDER_OFFER_STATUS.EXPIRED, '2026-10-04T08:00:00Z', 2);
  await offer(ORDER_OFFER_STATUS.DECLINED, '2026-09-29T08:00:00Z', 3);
  await db
    .insert(courierShifts)
    .values([
      shift(couriers.first, '2026-09-30T20:00:00Z', '2026-09-30T22:00:00Z'),
      shift(couriers.first, '2026-10-02T10:00:00Z', '2026-10-02T12:30:00Z'),
      shift(couriers.second, '2026-10-07T20:00:00Z', null),
      shift(couriers.idle, '2026-08-01T08:00:00Z', '2026-08-01T09:00:00Z'),
    ]);
  await placeCourierAt(db, couriers.second, MINSK_PICKUP, new Date('2026-10-07T20:30:00Z'));
}

async function applyPlan(
  db: Database,
  orderId: number,
  plan: AnalyticsPlan,
  courierId: number | null,
  actors: Record<AnalyticsActor, number | null>,
) {
  await db
    .update(orders)
    .set({
      status: plan.status,
      price: plan.price,
      courierId,
      estimatedMinutes: ANALYTICS_ESTIMATED_MINUTES,
      createdAt: new Date(plan.createdAt),
      finishedAt: plan.finishedAt === null ? null : new Date(plan.finishedAt),
    })
    .where(eq(orders.orderId, orderId));

  for (const [status, at, actor] of plan.steps) {
    await db
      .insert(orderStatusHistory)
      .values({ orderId, status, changedBy: actors[actor], changedAt: new Date(at) });
  }

  if (plan.paidAt !== null) {
    await insertPayment(db, orderId, {
      status: plan.refunded ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.PAID,
      paidAt: new Date(plan.paidAt),
      refundedAt: plan.refunded ? new Date(plan.paidAt) : null,
    });
  }
}

export async function seedAnalytics(
  app: NestExpressApplication,
  db: Database,
): Promise<AnalyticsCouriers> {
  const couriers = await seedCouriers(app, db);
  const { cookies } = await registerUser(app);
  const ids = await placeOrders(app, cookies, ANALYTICS_PLANS.length);
  const [{ clientId }] = await db.select({ clientId: orders.clientId }).from(orders).limit(1);
  const manager = await userIdOf(db, MANAGER_ACCOUNT.email);
  const courierUsers = {
    first: await userIdOf(db, COURIER_ACCOUNT.email),
    second: await userIdOf(db, SECOND_COURIER_ACCOUNT.email),
  };

  for (const [index, plan] of ANALYTICS_PLANS.entries()) {
    const courier = plan.courier === null ? null : courierUsers[plan.courier];
    const actors = { client: clientId, manager, system: null, courier };
    const courierId = plan.courier === null ? null : couriers[plan.courier];
    await applyPlan(db, ids[index], plan, courierId, actors);
  }

  await seedOffersAndShifts(db, couriers, ids[0]);

  return couriers;
}

export function getAnalytics(
  app: NestExpressApplication,
  cookies: string | null,
  route: string,
  query: Record<string, string | number> = {},
) {
  const request = getApi(app, `${MANAGER_ANALYTICS_ROUTES.BASE}/${route}`).query(query);

  return cookies === null ? request : request.set(COOKIE_HEADER, cookies);
}
