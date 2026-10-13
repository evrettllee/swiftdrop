import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { REFRESH_TOKEN_CLEANUP_CRON } from '../constants/tokens.constants';
import { TokensCleanupService } from '../services/tokens-cleanup.service';

@Injectable()
export class TokensCleanupJob {
  constructor(private readonly tokensCleanup: TokensCleanupService) {}

  @Cron(REFRESH_TOKEN_CLEANUP_CRON)
  async runScheduled(): Promise<void> {
    await this.tokensCleanup.deleteExpiredRefreshTokens();
  }
}
