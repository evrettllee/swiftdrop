import { Inject, Injectable } from '@nestjs/common';
import {
  type OrderCourierChanged,
  type OrderStatusChange,
  type OrderTransaction,
  runOrderTransaction,
} from '@/common/database/order-status-transition';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OrderEtaService } from './order-eta.service';
import { OrderEventsService } from './order-events.service';

// The transaction for work that changes the status of an order: the changes reach the order rooms
// and the arrival estimate once it commits, never before and never after a rollback.
@Injectable()
export class OrderTransactionsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly events: OrderEventsService,
    private readonly eta: OrderEtaService,
  ) {}

  run<T>(work: (orderTx: OrderTransaction) => Promise<T>): Promise<T> {
    return runOrderTransaction(this.db, work, (changes, courierChanges) =>
      this.publish(changes, courierChanges),
    );
  }

  // The status first: the client sees the new stage before its estimate.
  private publish(
    changes: readonly OrderStatusChange[],
    courierChanges: readonly OrderCourierChanged[],
  ): void {
    this.events.publishStatusChanges(changes);
    this.events.publishCourierChanges(courierChanges);
    this.eta.onStatusChanges(changes);
    this.eta.onCourierChanges(courierChanges);
  }
}
