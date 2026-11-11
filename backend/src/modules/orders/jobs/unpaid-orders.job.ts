import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { describeError } from '@/common/utils/describe-error';
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
        this.logger.error(`Cancelling unpaid orders failed: ${describeError(error)}`);
      } finally {
        this.isRunning = false;
      }
    }
  }
}
