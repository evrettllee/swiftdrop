import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ENV_FILE_PATH } from '@/config/env.constants';
import { validateEnv } from '@/config/env.validation';
import { DatabaseModule } from '@/database/database.module';
import { PaymentsModule } from '../payments.module';
import { PaymentReconciliationService } from '../services/payment-reconciliation.service';

// A one-off run (npm run payments:reconcile) over the payments left pending on cancelled orders.
// Only the modules it needs are loaded, so no scheduled job and no HTTP server start.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [ENV_FILE_PATH], validate: validateEnv }),
    DatabaseModule,
    PaymentsModule,
  ],
})
class PaymentsReconcileModule {}

async function main() {
  const app = await NestFactory.createApplicationContext(PaymentsReconcileModule);

  try {
    const summary = await app.get(PaymentReconciliationService).reconcileCancelledOrders();

    Logger.log(`Cancelled orders with pending payments: ${summary.orderCount}`, 'Reconcile');
    Logger.log(`Payments by outcome: ${JSON.stringify(summary.outcomes)}`, 'Reconcile');
    Logger.log(`Orders not reconciled: ${summary.failedOrderCount}`, 'Reconcile');

    if (summary.failedOrderCount > 0) {
      process.exitCode = 1;
    }
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
