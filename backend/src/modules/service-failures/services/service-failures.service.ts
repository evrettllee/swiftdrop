import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { SERVICE_FAILURE_FIELD_LENGTH } from '@/common/constants/field-lengths.constants';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import type { ServiceFailureCode } from '@/common/constants/service-failure-codes.constants';
import type { ServiceName } from '@/common/enums/service-name.enum';
import { describeError } from '@/common/utils/describe-error';
import { DRIZZLE } from '@/database/database.constants';
import type { Database, Transaction } from '@/database/database.module';
import { serviceFailures } from '@/database/schema';
import {
  FAILURE_LOCK_NAMESPACE,
  SERVICE_FAILURE_LOG_MESSAGES as LOG,
} from '../constants/service-failures.constants';
import { canMergeFailure, clipText } from '../utils/failure-merge';

type FailureEntry = { service: ServiceName; code: string; message: string; now: Date };

@Injectable()
export class ServiceFailuresService {
  private readonly logger = new Logger(ServiceFailuresService.name);

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async record<S extends ServiceName>(
    service: S,
    code: ServiceFailureCode<S>,
    message: string,
    now: Date = new Date(),
  ): Promise<void> {
    const entry = {
      service,
      code,
      message: clipText(message, SERVICE_FAILURE_FIELD_LENGTH.MESSAGE),
      now,
    };

    try {
      await this.db.transaction((tx) => this.mergeOrInsert(tx, entry));
    } catch (error) {
      this.logger.error(`${LOG.NOT_RECORDED}: ${service} ${code}, ${describeError(error)}`);
    }
  }

  private async mergeOrInsert(tx: Transaction, entry: FailureEntry): Promise<void> {
    const { service, code, message, now } = entry;

    await tx.execute(
      sql`select pg_advisory_xact_lock(${FAILURE_LOCK_NAMESPACE}, hashtext(${`${service}:${code}`}))`,
    );

    const [latest] = await tx
      .select({ failureId: serviceFailures.failureId, lastAt: serviceFailures.lastAt })
      .from(serviceFailures)
      .where(and(eq(serviceFailures.service, service), eq(serviceFailures.code, code)))
      .orderBy(desc(serviceFailures.lastAt))
      .limit(SINGLE_ROW_LIMIT);

    if (latest && canMergeFailure(latest.lastAt, now)) {
      await tx
        .update(serviceFailures)
        .set({ repeats: sql`${serviceFailures.repeats} + 1`, lastAt: now })
        .where(eq(serviceFailures.failureId, latest.failureId));

      return;
    }

    await tx.insert(serviceFailures).values({ service, code, message, firstAt: now, lastAt: now });
  }
}
