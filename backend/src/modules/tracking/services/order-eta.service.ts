import { Injectable, Logger, type OnApplicationShutdown, type OnModuleInit } from '@nestjs/common';
import { COURIER_ACTIVE_ORDER_STATUSES } from '@/common/constants/orders.constants';
import { MS_PER_SECOND } from '@/common/constants/time.constants';
import type { OrderStatusChange } from '@/common/database/order-status-transition';
import type { OrderStatus } from '@/common/enums/order-status.enum';
import { describeError } from '@/common/utils/describe-error';
import { OsrmTripService } from '@/integrations/osrm/services/osrm-trip.service';
import { CouriersGateway } from '@/modules/couriers/gateways/couriers.gateway';
import { CourierLocationEventsService } from '@/modules/couriers/services/courier-location-events.service';
import { isPositionStale } from '@/modules/deliveries/utils/courier-position';
import { routingProfileOf } from '@/modules/routing/utils/routing-courier';
import {
  ETA_RECALC_INTERVAL_MS,
  ETA_SHUTDOWN_WAIT_MS,
  ORDER_ROOM_EVENTS,
} from '../constants/tracking.constants';
import type { CourierLeg, OrderEtaEntry, OrderEtaEvent } from '../types/tracking.types';
import { etaPlan, pickupArrival } from '../utils/eta-points';
import { PendingTasks } from '../utils/pending-tasks';
import { OrderEtaDataService } from './order-eta-data.service';
import { OrderEtaStore } from './order-eta-store.service';

const activeStatuses = new Set<OrderStatus>(COURIER_ACTIVE_ORDER_STATUSES);

// The arrival estimate of an order with a courier and the line of the courier to their next point.
// A new position asks for it at most once per interval; a new status asks at once. One estimate
// of an order runs at a time. Skips are normal (no fresh position, routing down) and go to debug.
@Injectable()
export class OrderEtaService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(OrderEtaService.name);
  // Estimates run in the background: nobody awaits them but a shutdown and the tests.
  private readonly tasks = new PendingTasks();
  private stopping = false;

  constructor(
    private readonly store: OrderEtaStore,
    private readonly data: OrderEtaDataService,
    private readonly trips: OsrmTripService,
    private readonly gateway: CouriersGateway,
    private readonly locationEvents: CourierLocationEventsService,
  ) {}

  onModuleInit(): void {
    this.locationEvents.subscribe(({ orderId }) => void this.refresh(orderId, false));
  }

  // After a commit: a new status of an active order is estimated at once, a finished order is
  // forgotten.
  onStatusChanges(changes: readonly OrderStatusChange[]): void {
    for (const { orderId, status } of changes) {
      if (activeStatuses.has(status)) {
        void this.refresh(orderId, true);
      } else {
        this.store.delete(orderId);
      }
    }
  }

  // The stored line of the courier for the map, or null. An order not estimated yet (a restarted
  // server) gets an estimate in the background; its line comes with order:eta.
  courierLeg(orderId: number): CourierLeg | null {
    const leg = this.store.get(orderId)?.courierLeg ?? null;

    if (!this.store.get(orderId)) {
      void this.refresh(orderId, false);
    }

    return leg ? { geometry: leg.geometry, toPoint: leg.toPoint } : null;
  }

  // When the courier reaches the pickup point (ISO), estimated with the stored line; null when the
  // line leads to the recipient or nothing was estimated yet. Asks for no estimate by itself: the
  // route asks for the line first.
  pickupEtaAt(orderId: number): string | null {
    return this.store.get(orderId)?.courierLeg?.pickupEtaAt?.toISOString() ?? null;
  }

  // Waits for the estimates already running, then the database can go. No new one starts after.
  async onApplicationShutdown(): Promise<void> {
    this.stopping = true;

    if (!(await this.tasks.waitForIdle(ETA_SHUTDOWN_WAIT_MS))) {
      this.logger.warn(`Shutdown did not wait for ${this.tasks.size} running estimates`);
    }
  }

  // True once no estimate runs, false when the time is up first.
  waitForIdle(timeoutMs: number): Promise<boolean> {
    return this.tasks.waitForIdle(timeoutMs);
  }

  async refresh(orderId: number, force: boolean, nowMs: number = Date.now()): Promise<void> {
    const entry = this.stopping ? undefined : this.store.ensure(orderId);

    if (!entry) {
      this.logger.debug(`Estimate of order ${orderId} skipped: the server is stopping`);
    } else if (entry.inFlight) {
      entry.forceQueued ||= force;
    } else if (!force && nowMs - entry.computedAtMs < ETA_RECALC_INTERVAL_MS) {
      this.logger.debug(`Estimate of order ${orderId} skipped: asked too soon`);
    } else {
      await this.tasks.track(this.run(orderId, entry));
    }
  }

  private async run(orderId: number, entry: OrderEtaEntry): Promise<void> {
    entry.inFlight = true;

    try {
      await this.estimate(orderId, entry);
    } catch (error) {
      this.logger.error(`Estimate of order ${orderId} failed: ${describeError(error)}`);
    } finally {
      entry.inFlight = false;
    }

    if (entry.forceQueued) {
      entry.forceQueued = false;
      await this.refresh(orderId, true);
    }
  }

  // The breaker is checked before the order is read: while routing is down every position would
  // otherwise cost a read that leads nowhere.
  private async estimate(orderId: number, entry: OrderEtaEntry): Promise<void> {
    const source = this.trips.isAvailable() ? await this.data.load(orderId) : undefined;
    const plan =
      source?.position && etaPlan(source.status, source.position, source.pickup, source.delivery);

    if (source === undefined) {
      this.logger.debug(`Estimate of order ${orderId} skipped: routing is unavailable`);
    } else if (!source || !activeStatuses.has(source.status)) {
      this.store.delete(orderId);
      this.logger.debug(`Estimate of order ${orderId} skipped: the order is not active`);
    } else if (!plan || source.positionAgeMs === null || isPositionStale(source.positionAgeMs)) {
      this.logger.debug(`Estimate of order ${orderId} skipped: no fresh position`);
    } else {
      entry.computedAtMs = Date.now();
      const profile = routingProfileOf(source.vehicleType);
      const trip = await this.trips.getTrip(plan.points, profile);
      // Both times are counted from the same moment, once the routing service has answered.
      const answeredAtMs = Date.now();
      const eta = trip && new Date(answeredAtMs + trip.durationS * MS_PER_SECOND + plan.handoverMs);
      const saved = eta && (await this.data.save(orderId, source.status, eta));

      if (!trip || !saved || !source.locationUpdatedAt) {
        this.logger.debug(`Estimate of order ${orderId} not saved: no route or the order changed`);
      } else {
        const courierLeg = { geometry: trip.firstLegGeometry, toPoint: plan.toPoint };
        const pickupEtaAt = pickupArrival(plan, trip.firstLegDurationS, answeredAtMs);
        entry.courierLeg = {
          ...courierLeg,
          basedOnUpdatedAt: source.locationUpdatedAt,
          pickupEtaAt,
        };
        this.emit({
          orderId,
          estimatedDeliveryAt: saved.toISOString(),
          courierLeg,
          pickupEtaAt: pickupEtaAt?.toISOString() ?? null,
        });
      }
    }
  }

  private emit(event: OrderEtaEvent): void {
    try {
      this.gateway.emitToOrder(event.orderId, ORDER_ROOM_EVENTS.ORDER_ETA, event);
    } catch (error) {
      this.logger.error(`Estimate of order ${event.orderId} not sent: ${describeError(error)}`);
    }
  }
}
