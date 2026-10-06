import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { GLOBAL_PREFIX } from './common/constants/http';

// Shared by main.ts and the e2e tests, so both run the same HTTP configuration.
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.use(cookieParser());
}
