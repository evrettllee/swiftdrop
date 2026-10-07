import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  CSRF_ERROR_MESSAGE,
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
  CSRF_SKIP_KEY,
  SAFE_HTTP_METHODS,
} from '../constants/csrf.constants';

// Browsers cannot add a custom header to a cross-site request without CORS approval,
// and CORS is not enabled, so a forged request from another site never carries it.
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isAllowed =
      context.getType() !== 'http' ||
      this.isSkipped(context) ||
      this.isRequestAllowed(context.switchToHttp().getRequest());

    if (!isAllowed) {
      throw new ForbiddenException(CSRF_ERROR_MESSAGE);
    }

    return true;
  }

  private isSkipped(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean | undefined>(CSRF_SKIP_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) === true
    );
  }

  private isRequestAllowed(request: Request): boolean {
    const isSafeMethod = SAFE_HTTP_METHODS.includes(request.method);

    return isSafeMethod || request.header(CSRF_HEADER_NAME) === CSRF_HEADER_VALUE;
  }
}
