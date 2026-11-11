import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { exchangeRates } from '@/database/schema';
import type { KnownRate } from '../types/nbrb.types';

@Injectable()
export class SavedRateService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async find(currency: string): Promise<KnownRate | null> {
    const [saved] = await this.db
      .select({ rate: exchangeRates.rate, fetchedAt: exchangeRates.fetchedAt })
      .from(exchangeRates)
      .where(eq(exchangeRates.currency, currency))
      .limit(SINGLE_ROW_LIMIT);

    return saved ?? null;
  }

  async save(currency: string, { rate, fetchedAt }: KnownRate): Promise<void> {
    await this.db
      .insert(exchangeRates)
      .values({ currency, rate, fetchedAt })
      .onConflictDoUpdate({ target: exchangeRates.currency, set: { rate, fetchedAt } });
  }
}
