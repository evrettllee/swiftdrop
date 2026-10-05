import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  CSRF_ERROR_MESSAGE,
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
  SAFE_HTTP_METHODS,
} from '../common.constants';

// Browsers cannot add a custom header to a cross-site request without CORS approval,
// and CORS is not enabled, so a forged request from another site never carries it.
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const isAllowed =
      context.getType() !== 'http' || this.isRequestAllowed(context.switchToHttp().getRequest());

    if (!isAllowed) {
      throw new ForbiddenException(CSRF_ERROR_MESSAGE);
    }

    return true;
  }

  private isRequestAllowed(request: Request): boolean {
    const isSafeMethod = SAFE_HTTP_METHODS.includes(request.method);

    return isSafeMethod || request.header(CSRF_HEADER_NAME) === CSRF_HEADER_VALUE;
  }
}
