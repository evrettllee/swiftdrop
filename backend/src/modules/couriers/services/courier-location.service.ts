import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, exists, isNull, lte, or, sql } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { courierActiveOrder } from '@/common/database/courier-active-order';
import { isLockTimeout } from '@/common/database/pg-errors';
import type { GeoPoint } from '@/common/schemas/geo-point.schema';
import { describeError } from '@/common/utils/describe-error';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { courierProfiles, orders, users } from '@/database/schema';
import {
  LOCATION_MIN_INTERVAL_MS,
  LOCATION_UPDATE_REJECTIONS,
} from '../constants/courier-location.constants';
import { locationUpdateBodySchema } from '../dto/location-update.dto';
import type {
  CourierLocationSession,
  LocationUpdateRejection,
  LocationUpdateResult,
} from '../types/courier-location.types';
import { rejectLocationUpdate } from '../utils/location-update';

// A stored position: the time of the database and the order the courier carries, if any.
export type SavedLocation = { locationUpdatedAt: Date; activeOrderId: number | null };

const REFUSED = (reason: LocationUpdateRejection): LocationUpdateResult => ({
  ack: { ok: false, reason },
  event: null,
});

@Injectable()
export class CourierLocationService {
  private readonly logger = new Logger(CourierLocationService.name);

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  // A position sent on the socket of a courier: checked, then saved when the checks pass. The
  // socket check is only a cheap filter; the limit per courier is kept by the query itself.
  async update(data: CourierLocationSession, body: unknown): Promise<LocationUpdateResult> {
    const nowMs = Date.now();
    const rejection = rejectLocationUpdate(data, nowMs);
    const point = locationUpdateBodySchema.safeParse(body);
    let result: LocationUpdateResult;

    if (rejection) {
      result = REFUSED(rejection);
    } else if (!point.success) {
      result = REFUSED(LOCATION_UPDATE_REJECTIONS.INVALID_LOCATION);
    } else {
      data.lastLocationAtMs = nowMs;
      result = await this.record(data.courierProfileId, point.data);
    }

    return result;
  }

  // Saves the position and answers the socket: a failure is a refusal in the acknowledgement,
  // never an error the client does not wait for.
  async record(courierProfileId: number, point: GeoPoint): Promise<LocationUpdateResult> {
    let result: LocationUpdateResult = { ack: { ok: true }, event: null };

    try {
      const saved = await this.save(courierProfileId, point);

      if (!saved) {
        result = REFUSED(await this.refusalReason(courierProfileId));
      } else if (saved.activeOrderId !== null) {
        result.event = {
          orderId: saved.activeOrderId,
          latitude: point.latitude,
          longitude: point.longitude,
          updatedAt: saved.locationUpdatedAt.toISOString(),
        };
      }
    } catch (error) {
      // Going on or off shift holds the profile row: the next position comes in a few seconds.
      result = REFUSED(LOCATION_UPDATE_REJECTIONS.BUSY);

      if (!isLockTimeout(error)) {
        this.logger.error(
          `Position of courier ${courierProfileId} not saved: ${describeError(error)}`,
        );
        result = REFUSED(LOCATION_UPDATE_REJECTIONS.UNAVAILABLE);
      }
    }

    return result;
  }

  // One statement: the position is kept for a courier whose account is not blocked, on shift or
  // with an active order, at most once per interval whatever sockets the courier has open. The
  // checks run on the locked row, so a position never outlives going off shift. Null when a check
  // refused it.
  async save(courierProfileId: number, point: GeoPoint): Promise<SavedLocation | null> {
    const [saved] = await this.db
      .update(courierProfiles)
      .set({
        currentLat: point.latitude,
        currentLng: point.longitude,
        locationUpdatedAt: sql`now()`,
      })
      .where(
        and(
          eq(courierProfiles.courierProfileId, courierProfileId),
          exists(this.activeUser()),
          or(eq(courierProfiles.isAvailable, true), exists(this.activeOrder())),
          or(
            isNull(courierProfiles.locationUpdatedAt),
            lte(
              courierProfiles.locationUpdatedAt,
              sql`now() - ${LOCATION_MIN_INTERVAL_MS}::int * interval '1 millisecond'`,
            ),
          ),
        ),
      )
      .returning({
        locationUpdatedAt: courierProfiles.locationUpdatedAt,
        activeOrderId: sql<number | null>`(${this.activeOrder()})`,
      });

    return saved?.locationUpdatedAt
      ? { ...saved, locationUpdatedAt: saved.locationUpdatedAt }
      : null;
  }

  // Why the position was not kept: a blocked account, off shift without an order, otherwise too
  // soon after the last. Runs only after a refusal, so a stored position costs one query.
  async refusalReason(courierProfileId: number): Promise<LocationUpdateRejection> {
    const [profile] = await this.db
      .select({
        isActiveUser: sql<boolean>`exists(${this.activeUser()})`,
        mayShare: sql<boolean>`${courierProfiles.isAvailable} OR exists(${this.activeOrder()})`,
      })
      .from(courierProfiles)
      .where(eq(courierProfiles.courierProfileId, courierProfileId))
      .limit(SINGLE_ROW_LIMIT);
    let reason: LocationUpdateRejection = LOCATION_UPDATE_REJECTIONS.TOO_FREQUENT;

    if (!profile?.isActiveUser) {
      reason = LOCATION_UPDATE_REJECTIONS.UNAUTHORIZED;
    } else if (!profile.mayShare) {
      reason = LOCATION_UPDATE_REJECTIONS.OFF_SHIFT;
    }

    return reason;
  }

  // The account of the courier of the outer row, unless it is blocked: found by its primary key.
  private activeUser() {
    return this.db
      .select({ userId: users.userId })
      .from(users)
      .where(and(eq(users.userId, courierProfiles.userId), eq(users.isBlocked, false)));
  }

  // The order of the courier of the outer row, found by the partial unique index of active orders.
  private activeOrder() {
    return this.db
      .select({ orderId: orders.orderId })
      .from(orders)
      .where(courierActiveOrder(courierProfiles.courierProfileId));
  }
}
