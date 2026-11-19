import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  ForbiddenException,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  OAUTH_BLOCKED_REDIRECT,
  OAUTH_ERROR_MESSAGES,
  OAUTH_FAILURE_REDIRECT,
  OAUTH_INVITE_PENDING_REDIRECT,
} from '../constants/oauth.constants';
import { InvitePendingException } from '../errors/invite-pending.exception';

function redirectOf(exception: unknown): string {
  if (exception instanceof InvitePendingException) {
    return OAUTH_INVITE_PENDING_REDIRECT;
  }

  return exception instanceof ForbiddenException ? OAUTH_BLOCKED_REDIRECT : OAUTH_FAILURE_REDIRECT;
}

function describeFailure(exception: unknown): string {
  if (exception instanceof HttpException) {
    return exception.message;
  }

  return exception instanceof Error ? exception.name : OAUTH_ERROR_MESSAGES.UNKNOWN_ERROR;
}

// Browser redirects cannot show JSON errors, so failures send the user back to the site instead.
@Catch()
export class OAuthFailureFilter implements ExceptionFilter {
  private readonly logger = new Logger(OAuthFailureFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    this.logger.warn(`OAuth login failed: ${describeFailure(exception)}`);
    response.redirect(redirectOf(exception));
  }
}
