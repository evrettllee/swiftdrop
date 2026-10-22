import { Inject, Injectable } from '@nestjs/common';
import {
  type OrderTransaction,
  runOrderTransaction,
} from '../../../common/database/order-status-transition';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { OrderEventsService } from './order-events.service';

// The transaction for work that changes the status of an order: the changes reach the order rooms
// once it commits, never before and never after a rollback.
@Injectable()
export class OrderTransactionsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly events: OrderEventsService,
  ) {}

  run<T>(work: (orderTx: OrderTransaction) => Promise<T>): Promise<T> {
    return runOrderTransaction(this.db, work, (changes) =>
      this.events.publishStatusChanges(changes),
    );
  }
}
