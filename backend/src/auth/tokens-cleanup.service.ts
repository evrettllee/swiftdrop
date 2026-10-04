import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { lt } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.constants';
import type { Database } from '../database/database.module';
import { refreshTokens } from '../db/schema';
import { REFRESH_TOKEN_CLEANUP_CRON } from './auth-cleanup.constants';

@Injectable()
export class TokensCleanupService {
  private readonly logger = new Logger(TokensCleanupService.name);

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  // Revoked but unexpired tokens are kept: they are needed to detect token reuse.
  @Cron(REFRESH_TOKEN_CLEANUP_CRON)
  async deleteExpiredRefreshTokens(): Promise<void> {
    const deleted = await this.db
      .delete(refreshTokens)
      .where(lt(refreshTokens.expiresAt, new Date()))
      .returning({ tokenId: refreshTokens.tokenId });

    this.logger.log(`Deleted ${deleted.length} expired refresh tokens`);
  }
}
