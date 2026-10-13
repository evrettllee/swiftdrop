import { type ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { INTERNAL_ERROR_MESSAGE } from '../constants/http.constants';
import { describeError } from '../utils/describe-error';

// An unexpected failure answers 500 with a general message: its text, stack or SQL never reach the
// client and go to the log instead. HTTP errors of the app (validation, 401, 403, 404, 409, 429)
// and of the body parser (malformed JSON, too large a body) keep their answers.
@Catch()
export class InternalErrorFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(InternalErrorFilter.name);

  override catch(exception: unknown, host: ArgumentsHost): void {
    if (exception instanceof HttpException || this.isHttpError(exception)) {
      super.catch(exception, host);
      return;
    }

    this.logger.error(
      describeError(exception),
      exception instanceof Error ? exception.stack : undefined,
    );

    const response: unknown = host.switchToHttp().getResponse();
    // Registered as APP_FILTER, the filter gets the adapter through its host, as the base filter does.
    const adapter = this.applicationRef ?? this.httpAdapterHost?.httpAdapter;
    adapter?.reply(
      response,
      { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: INTERNAL_ERROR_MESSAGE },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
