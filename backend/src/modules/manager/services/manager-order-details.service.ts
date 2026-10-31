import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ORDER_NOT_FOUND_MESSAGE } from '@/common/constants/orders.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import type { ManagerOrderDetails } from '../dto/manager-order-details.dto';
import { toManagerOrderDetails } from '../mappers/manager-order-details.mapper';
import {
  findHistory,
  findOffers,
  findSettledPayments,
  findTickets,
} from '../utils/manager-order-related-queries';
import { findOrderRow } from '../utils/manager-order-row-query';

@Injectable()
export class ManagerOrderDetailsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findOne(orderId: number): Promise<ManagerOrderDetails> {
    const [order, payments, history, offers, tickets] = await Promise.all([
      findOrderRow(this.db, orderId),
      findSettledPayments(this.db, orderId),
      findHistory(this.db, orderId),
      findOffers(this.db, orderId),
      findTickets(this.db, orderId),
    ]);

    if (!order) {
      throw new NotFoundException(ORDER_NOT_FOUND_MESSAGE);
    }

    return toManagerOrderDetails({ order, payments, history, offers, tickets });
  }
}
