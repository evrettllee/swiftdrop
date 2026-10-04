import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  OAUTH_BLOCKED_REDIRECT,
  OAUTH_ERROR_MESSAGES,
  OAUTH_FAILURE_REDIRECT,
} from '../oauth.constants';

// Browser redirects cannot show JSON errors, so failures send the user back to the site instead.
@Catch()
export class OAuthFailureFilter implements ExceptionFilter {
  private readonly logger = new Logger(OAuthFailureFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const message =
      exception instanceof Error ? exception.message : OAUTH_ERROR_MESSAGES.UNKNOWN_ERROR;
    const redirectUrl =
      exception instanceof ForbiddenException ? OAUTH_BLOCKED_REDIRECT : OAUTH_FAILURE_REDIRECT;

    this.logger.warn(`OAuth login failed: ${message}`);
    response.redirect(redirectUrl);
  }
}
