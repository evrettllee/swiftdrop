import { CronExpression } from '@nestjs/schedule';

export const REFRESH_TOKEN_CLEANUP_CRON = CronExpression.EVERY_DAY_AT_3AM;
