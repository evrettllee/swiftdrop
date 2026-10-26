import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, inArray, lte, notExists, sql } from 'drizzle-orm';
import { courierActiveOrder } from '@/common/database/courier-active-order';
import { ORDER_OFFER_STATUS } from '@/common/enums/order-offer-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { courierProfiles, orderOffers, orders, users, vehicles } from '@/database/schema';
import {
  ASSIGNMENT_RADIUS_KM,
  COURIER_LOCATION_FRESH_MS,
  ROUTED_CANDIDATES_LIMIT,
} from '../constants/assignment.constants';
import type { CourierCandidate, DispatchOrder } from '../types/assignment.types';
import { approxDistanceKm } from '../utils/approx-distance';
import { vehiclesThatCarry } from '../utils/vehicle-routing';

@Injectable()
export class CourierCandidatesService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  // The couriers who may get the order, the nearest to the pickup point first.
  async findNearest(order: DispatchOrder, now: Date = new Date()): Promise<CourierCandidate[]> {
    const distanceKm = approxDistanceKm(
      courierProfiles.currentLat,
      courierProfiles.currentLng,
      order.pickup,
    );
    const freshSince = new Date(now.getTime() - COURIER_LOCATION_FRESH_MS);

    return this.db
      .select({
        courierProfileId: courierProfiles.courierProfileId,
        vehicleType: vehicles.type,
        // A fresh position is never empty: the check constraint keeps it whole.
        position: {
          latitude: sql<number>`${courierProfiles.currentLat}`,
          longitude: sql<number>`${courierProfiles.currentLng}`,
        },
        distanceKm,
      })
      .from(courierProfiles)
      .innerJoin(vehicles, eq(vehicles.courierProfileId, courierProfiles.courierProfileId))
      .innerJoin(users, eq(users.userId, courierProfiles.userId))
      .where(
        and(
          eq(courierProfiles.isAvailable, true),
          // A blocked courier cannot answer an offer, so it would only expire.
          eq(users.isBlocked, false),
          gte(courierProfiles.locationUpdatedAt, freshSince),
          inArray(vehicles.type, vehiclesThatCarry(order.parcel)),
          lte(distanceKm, ASSIGNMENT_RADIUS_KM),
          notExists(this.activeOrders()),
          notExists(this.pendingOffers()),
          notExists(this.offersOfOrder(order.orderId)),
        ),
      )
      .orderBy(distanceKm)
      .limit(ROUTED_CANDIDATES_LIMIT);
  }

  // The subqueries below refer to the courier of the outer query.

  private activeOrders() {
    return this.db
      .select({ orderId: orders.orderId })
      .from(orders)
      .where(courierActiveOrder(courierProfiles.courierProfileId));
  }

  private pendingOffers() {
    return this.db
      .select({ offerId: orderOffers.offerId })
      .from(orderOffers)
      .where(
        and(
          eq(orderOffers.courierId, courierProfiles.courierProfileId),
          eq(orderOffers.status, ORDER_OFFER_STATUS.PENDING),
        ),
      );
  }

  // An order is offered to a courier once: a decline or a missed offer is final for that order.
  private offersOfOrder(orderId: number) {
    return this.db
      .select({ offerId: orderOffers.offerId })
      .from(orderOffers)
      .where(
        and(
          eq(orderOffers.courierId, courierProfiles.courierProfileId),
          eq(orderOffers.orderId, orderId),
        ),
      );
  }
}
