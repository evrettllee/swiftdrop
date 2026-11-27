import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import {
  GLOBAL_PREFIX,
  JSON_BODY_LIMIT,
  SECURITY_RESPONSE_HEADERS,
  X_POWERED_BY_SETTING,
} from '@/common/constants/http.constants';

export function setSecurityHeaders(
  _request: Request,
  response: Response,
  next: NextFunction,
): void {
  for (const [name, value] of SECURITY_RESPONSE_HEADERS) {
    response.setHeader(name, value);
  }

  next();
}

export function configureApp(app: NestExpressApplication): void {
  app.disable(X_POWERED_BY_SETTING);
  app.use(setSecurityHeaders);
  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  app.use(cookieParser());
}
