import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import type { Database } from '@/database/database.module';
import { MANAGER_COURIERS_ROUTES } from '@/modules/manager/constants/manager-couriers-map.constants';
import { addCourierSession, insertOffer } from './assignment';
import { COOKIE_HEADER } from './auth';
import {
  assignOrder,
  CAR,
  COURIER_ACCOUNT,
  createCourier,
  getCourierMe,
  placeCourierAt,
} from './couriers';
import { MINSK_PICKUP } from './fixtures';
import { getApi } from './http';
import { blockUser } from './users';

export const MAP_STALE_AT = new Date(Date.now() - 5 * 60_000);

function account(index: number, lastName: string) {
  return {
    ...COURIER_ACCOUNT,
    firstName: 'Курьер',
    lastName,
    email: `map-courier-${index}@example.com`,
    phone: `+37533100000${index}`,
  };
}

export const MAP_FREE = account(1, 'Абрамов');
const ON_ORDER = account(2, 'Борисов');
const OFFER = account(3, 'Васильев');
const NO_SIGNAL = account(4, 'Григорьев');
const OFF_SHIFT = account(5, 'Дмитриев');
const BLOCKED = account(6, 'Егоров');

export type MapCourierIds = Record<'free' | 'onOrder' | 'offer' | 'noSignal', number>;

export async function seedCouriersMap(
  app: NestExpressApplication,
  db: Database,
  orderIds: readonly number[],
): Promise<{ ids: MapCourierIds; freeCookies: string }> {
  const session = (target: typeof MAP_FREE) =>
    addCourierSession(app, db, target, CAR, MINSK_PICKUP);
  const free = await session(MAP_FREE);
  const onOrder = await session(ON_ORDER);
  const offer = await session(OFFER);
  const noSignal = await session(NO_SIGNAL);
  await session(BLOCKED);
  await getCourierMe(app, await createCourier(app, db, OFF_SHIFT)).expect(HttpStatus.OK);
  await assignOrder(db, orderIds[0], onOrder.courierProfileId, ORDER_STATUS.COURIER_ASSIGNED);
  await insertOffer(db, orderIds[1], offer.courierProfileId);
  await placeCourierAt(db, noSignal.courierProfileId, MINSK_PICKUP, MAP_STALE_AT);
  await blockUser(db, BLOCKED.email);

  return {
    ids: {
      free: free.courierProfileId,
      onOrder: onOrder.courierProfileId,
      offer: offer.courierProfileId,
      noSignal: noSignal.courierProfileId,
    },
    freeCookies: free.cookies,
  };
}

export function getCouriersMap(
  app: NestExpressApplication,
  cookies: string | null,
  query: Record<string, string> = {},
) {
  const request = getApi(
    app,
    `${MANAGER_COURIERS_ROUTES.BASE}/${MANAGER_COURIERS_ROUTES.MAP}`,
  ).query(query);

  return cookies === null ? request : request.set(COOKIE_HEADER, cookies);
}
