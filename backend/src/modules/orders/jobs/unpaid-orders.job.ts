import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UNPAID_ORDERS_CRON } from '../constants/orders.constants';
import { UnpaidOrdersService } from '../services/unpaid-orders.service';

@Injectable()
export class UnpaidOrdersJob {
  private readonly logger = new Logger(UnpaidOrdersJob.name);
  private isRunning = false;

  constructor(private readonly unpaidOrders: UnpaidOrdersService) {}

  @Cron(UNPAID_ORDERS_CRON)
  async runScheduled(): Promise<void> {
    if (!this.isRunning) {
      this.isRunning = true;

      try {
        await this.unpaidOrders.cancelExpired();
      } catch (error) {
        this.logger.error(
          `Cancelling unpaid orders failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        this.isRunning = false;
      }
    }
  }
}
