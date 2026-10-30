import { and, asc, eq, exists, ilike, inArray, type SQL, sql } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { positionAgeMsSql } from '@/common/database/position-age';
import { ORDER_OFFER_STATUS } from '@/common/enums/order-offer-status.enum';
import type { VehicleType } from '@/common/enums/vehicle-type.enum';
import type { Database, Transaction } from '@/database/database.module';
import { courierProfiles, orderOffers, users, vehicles } from '@/database/schema';
import { fullNameSql } from '@/database/sql-expressions';
import type { DispatchOrder } from '@/modules/assignment/types/assignment.types';
import { approxDistanceKm } from '@/modules/assignment/utils/approx-distance';
import {
  courierAccountActive,
  courierEligibility,
  eligibleCourier,
  ineligibleCourier,
  isTrue,
} from '@/modules/assignment/utils/courier-eligibility';
import {
  CANDIDATE_SORT,
  type CandidateSort,
  METERS_PER_KM,
} from '../constants/manager-assignment.constants';
import type { CourierCandidateRow } from '../types/manager-assignment.types';
import type { OrderSearch } from '../types/manager-orders.types';

export type CandidateFilters = {
  search: OrderSearch | null;
  vehicleTypes: VehicleType[] | null;
};

type CandidateOrder = Pick<DispatchOrder, 'pickup' | 'parcel'>;

function pickupDistanceM(order: CandidateOrder): SQL<number | null> {
  const km = approxDistanceKm(courierProfiles.currentLat, courierProfiles.currentLng, order.pickup);

  return sql<number | null>`round(${km} * ${METERS_PER_KM})::int`;
}

function openOfferExists(db: Database): SQL {
  return exists(
    db
      .select({ offerId: orderOffers.offerId })
      .from(orderOffers)
      .where(
        and(
          eq(orderOffers.courierId, courierProfiles.courierProfileId),
          eq(orderOffers.status, ORDER_OFFER_STATUS.PENDING),
        ),
      ),
  );
}

function searchCondition(search: OrderSearch | null): SQL | undefined {
  if (search === null) {
    return undefined;
  }

  if (search.kind === 'text') {
    return ilike(fullNameSql(users.firstName, users.lastName), search.pattern);
  }

  return search.phone === null ? sql`false` : eq(users.phone, search.phone);
}

function orderByOf(sort: CandidateSort, order: CandidateOrder): SQL[] {
  const byName = [asc(users.lastName), asc(users.firstName), asc(courierProfiles.courierProfileId)];

  return sort === CANDIDATE_SORT.NAME
    ? byName
    : [sql`${pickupDistanceM(order)} asc nulls last`, asc(courierProfiles.courierProfileId)];
}

function candidateColumns(db: Database, order: CandidateOrder, now: Date) {
  const eligibility = courierEligibility(db, order.parcel, now);

  return {
    eligible: eligibleCourier(eligibility),
    ineligible: ineligibleCourier(eligibility),
    columns: {
      courierId: courierProfiles.courierProfileId,
      firstName: users.firstName,
      lastName: users.lastName,
      vehicleType: vehicles.type,
      pickupDistanceM: pickupDistanceM(order),
      positionAgeMs: positionAgeMsSql(courierProfiles.locationUpdatedAt),
      hasOpenOffer: openOfferExists(db).mapWith(Boolean),
      onShift: isTrue(eligibility.onShift).mapWith(Boolean),
      freshLocation: isTrue(eligibility.freshLocation).mapWith(Boolean),
      free: isTrue(eligibility.free).mapWith(Boolean),
      hasVehicle: isTrue(eligibility.hasVehicle).mapWith(Boolean),
      vehicleFits: isTrue(eligibility.vehicleFits).mapWith(Boolean),
    },
  };
}

export function courierCandidatesQuery(
  db: Database,
  order: CandidateOrder,
  now: Date,
  options: { filters: CandidateFilters; suitable: boolean; sort: CandidateSort; limit: number },
) {
  const { eligible, ineligible, columns } = candidateColumns(db, order, now);
  const { search, vehicleTypes } = options.filters;

  return db
    .select(columns)
    .from(courierProfiles)
    .innerJoin(users, eq(users.userId, courierProfiles.userId))
    .leftJoin(vehicles, eq(vehicles.courierProfileId, courierProfiles.courierProfileId))
    .where(
      and(
        courierAccountActive,
        options.suitable ? eligible : ineligible,
        searchCondition(search),
        vehicleTypes === null ? undefined : inArray(vehicles.type, vehicleTypes),
      ),
    )
    .orderBy(...orderByOf(options.sort, order))
    .limit(options.limit);
}

export async function findCourierChecks(
  db: Database,
  tx: Transaction,
  order: CandidateOrder,
  courierId: number,
  now: Date,
): Promise<CourierCandidateRow | null> {
  const { columns } = candidateColumns(db, order, now);
  const [row] = await tx
    .select(columns)
    .from(courierProfiles)
    .innerJoin(users, eq(users.userId, courierProfiles.userId))
    .leftJoin(vehicles, eq(vehicles.courierProfileId, courierProfiles.courierProfileId))
    .where(and(eq(courierProfiles.courierProfileId, courierId), courierAccountActive))
    .limit(SINGLE_ROW_LIMIT);

  return row ?? null;
}
