import { and, asc, count, eq, inArray, isNotNull, or, type SQL, sql } from 'drizzle-orm';
import { positionAgeMsSql } from '@/common/database/position-age';
import { courierActiveOrder } from '@/common/database/courier-active-order';
import { ORDER_OFFER_STATUS } from '@/common/enums/order-offer-status.enum';
import type { VehicleType } from '@/common/enums/vehicle-type.enum';
import type { Database } from '@/database/database.module';
import { sqlLiteral } from '@/database/sql-literal';
import { courierProfiles, orderOffers, orders, users, vehicles } from '@/database/schema';
import { courierAccountActive } from '@/modules/assignment/utils/courier-eligibility';
import { COURIER_LOCATION_STALE_MS } from '@/modules/deliveries/constants/deliveries.constants';
import {
  COURIER_MAP_STATE,
  COURIERS_MAP_LIMIT,
  type CourierMapState,
} from '../constants/manager-couriers-map.constants';
import type { OrderSearch } from '../types/manager-orders.types';
import { courierSearchCondition } from './courier-candidates-query';

export type CouriersMapFilters = {
  states: CourierMapState[] | null;
  vehicleTypes: VehicleType[] | null;
  search: OrderSearch | null;
};

function openOfferOrderId(db: Database): SQL<number | null> {
  const offer = db
    .select({ orderId: orderOffers.orderId })
    .from(orderOffers)
    .where(
      and(
        eq(orderOffers.courierId, courierProfiles.courierProfileId),
        eq(orderOffers.status, ORDER_OFFER_STATUS.PENDING),
      ),
    )
    .limit(1);

  return sql<number | null>`(${offer})`;
}

export function courierMapStateSql(offerOrderId: SQL<number | null>): SQL<CourierMapState> {
  const age = positionAgeMsSql(courierProfiles.locationUpdatedAt);

  return sql<CourierMapState>`case
    when ${courierProfiles.locationUpdatedAt} is null or ${age} > ${COURIER_LOCATION_STALE_MS}
      then ${sqlLiteral(COURIER_MAP_STATE.NO_SIGNAL)}
    when ${orders.orderId} is not null then ${sqlLiteral(COURIER_MAP_STATE.ON_ORDER)}
    when ${offerOrderId} is not null then ${sqlLiteral(COURIER_MAP_STATE.OFFER)}
    else ${sqlLiteral(COURIER_MAP_STATE.FREE)}
  end`;
}

function mapRows(db: Database, filters: CouriersMapFilters) {
  const offerOrderId = openOfferOrderId(db);

  return db
    .select({
      courierId: courierProfiles.courierProfileId,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      vehicleType: vehicles.type,
      lat: courierProfiles.currentLat,
      lng: courierProfiles.currentLng,
      positionAt: courierProfiles.locationUpdatedAt,
      positionAgeMs: positionAgeMsSql(courierProfiles.locationUpdatedAt).as('position_age_ms'),
      state: courierMapStateSql(offerOrderId).as('state'),
      activeOrderId: sql<number | null>`${orders.orderId}`.as('active_order_id'),
      activeOrderStatus: orders.status,
      openOfferOrderId: offerOrderId.as('open_offer_order_id'),
    })
    .from(courierProfiles)
    .innerJoin(users, eq(users.userId, courierProfiles.userId))
    .leftJoin(vehicles, eq(vehicles.courierProfileId, courierProfiles.courierProfileId))
    .leftJoin(orders, courierActiveOrder(courierProfiles.courierProfileId))
    .where(
      and(
        courierAccountActive,
        or(eq(courierProfiles.isAvailable, true), isNotNull(orders.orderId)),
        filters.vehicleTypes === null ? undefined : inArray(vehicles.type, filters.vehicleTypes),
        courierSearchCondition(filters.search),
      ),
    )
    .as('courier_map');
}

export function couriersMapQueries(db: Database, filters: CouriersMapFilters) {
  const rows = mapRows(db, filters);

  return {
    items: db
      .select()
      .from(rows)
      .where(filters.states === null ? undefined : inArray(rows.state, filters.states))
      .orderBy(asc(rows.lastName), asc(rows.firstName), asc(rows.courierId))
      .limit(COURIERS_MAP_LIMIT),
    counts: db.select({ state: rows.state, total: count() }).from(rows).groupBy(rows.state),
  };
}
