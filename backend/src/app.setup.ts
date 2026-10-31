import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { GLOBAL_PREFIX, JSON_BODY_LIMIT } from '@/common/constants/http.constants';

// Shared by main.ts and the e2e tests, so both run the same HTTP configuration.
export function configureApp(app: NestExpressApplication): void {
  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  app.use(cookieParser());
}
