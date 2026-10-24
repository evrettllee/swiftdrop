import type { ClientOrderRoute, OrderStatus } from '@/shared/api';
import type { GeoPoint } from '@/shared/lib/geo';
import type { CourierLeg } from '@/shared/realtime';
import { COURIER_POSITION_STALE_MS } from '../config/tracking';
import {
  courierLegOfRoute,
  isFinishedStatus,
  NO_TRACKING,
  type OrderTrackingState,
  PAGE_CLOCK,
  type TrackingClock,
  withStatus,
} from './tracking-state';

// One order followed by the page: its details and route as the backend answered, then the events
// of its room. Once the order is over, the events of the courier are dropped. A position never goes
// back to an older one, and a minute without a new one marks the connection as lost.
export class OrderTracking {
  private state: OrderTrackingState = NO_TRACKING;
  private readonly listeners = new Set<() => void>();
  private staleTimer: number | null = null;
  private readonly clock: TrackingClock;

  constructor(clock: TrackingClock = PAGE_CLOCK) {
    this.clock = clock;
  }

  getState = (): OrderTrackingState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  // The details of the order (GET /orders/:id) or order:status.
  applyStatus(status: OrderStatus, estimatedDeliveryAt: Date | null): void {
    if (this.isFinished()) {
      return;
    }

    this.set(withStatus(this.state, status, estimatedDeliveryAt));

    if (this.isFinished()) {
      this.stopStaleTimer();
    }
  }

  // GET /orders/:id/route: the line, the arrival at the pickup point and the position, which is
  // already a minute old when the backend says it is stale.
  applyRoute(route: ClientOrderRoute): void {
    if (this.isFinished()) {
      return;
    }

    this.set({
      ...this.state,
      courierLeg: courierLegOfRoute(route),
      pickupEtaAt: route.pickupEtaAt,
    });

    if (route.courierPosition !== null) {
      const { isStale, updatedAt, ...point } = route.courierPosition;
      const ageMs = Math.min(
        Math.max(this.clock.now() - updatedAt.getTime(), 0),
        COURIER_POSITION_STALE_MS,
      );
      this.placePosition(point, updatedAt, isStale ? COURIER_POSITION_STALE_MS : ageMs);
    }
  }

  // order:eta.
  applyEta(
    estimatedDeliveryAt: Date,
    courierLeg: CourierLeg | null,
    pickupEtaAt: Date | null,
  ): void {
    if (!this.isFinished()) {
      this.set({ ...this.state, estimatedDeliveryAt, courierLeg, pickupEtaAt });
    }
  }

  // courier:location: the position has just come.
  applyLocation(point: GeoPoint, updatedAt: Date): void {
    if (!this.isFinished()) {
      this.placePosition(point, updatedAt, 0);
    }
  }

  // The page left the order: nothing is counted any more.
  dispose(): void {
    this.stopStaleTimer();
  }

  // A position `ageMs` old by the clock of the page; an older one than kept changes nothing.
  private placePosition(point: GeoPoint, updatedAt: Date, ageMs: number): void {
    const kept = this.state.courierPosition;

    if (kept !== null && updatedAt.getTime() <= kept.updatedAt.getTime()) {
      return;
    }

    const isStale = ageMs >= COURIER_POSITION_STALE_MS;
    this.stopStaleTimer();
    this.set({
      ...this.state,
      courierPosition: { ...point, updatedAt },
      positionReceivedAt: this.clock.now() - ageMs,
      isPositionStale: isStale,
    });

    if (!isStale) {
      this.staleTimer = this.clock.setTimeout(() => {
        this.staleTimer = null;
        this.set({ ...this.state, isPositionStale: true });
      }, COURIER_POSITION_STALE_MS - ageMs);
    }
  }

  private isFinished(): boolean {
    return isFinishedStatus(this.state.status);
  }

  private stopStaleTimer(): void {
    if (this.staleTimer !== null) {
      this.clock.clearTimeout(this.staleTimer);
      this.staleTimer = null;
    }
  }

  private set(next: OrderTrackingState): void {
    this.state = next;
    this.listeners.forEach((listener) => listener());
  }
}
