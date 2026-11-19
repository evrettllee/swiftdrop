import { type ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { INTERNAL_ERROR_MESSAGE } from '@/common/constants/http.constants';
import { SERVICE_FAILURE_CODE } from '@/common/constants/service-failure-codes.constants';
import { SERVICE_NAME } from '@/common/enums/service-name.enum';
import { describeError, describeErrorStack } from '@/common/utils/describe-error';
import { ServiceFailuresService } from '@/modules/service-failures/services/service-failures.service';
import { type FailedRequest, serverFailureMessage } from './server-failure';

const HTTP_CONTEXT = 'http';

// An unexpected failure answers 500 with a general message: its text, stack or SQL never reach the
// client and go to the log instead. HTTP errors of the app (validation, 401, 403, 404, 409, 429)
// and of the body parser (malformed JSON, too large a body) keep their answers.
@Catch()
export class InternalErrorFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(InternalErrorFilter.name);

  constructor(private readonly failures: ServiceFailuresService) {
    super();
  }

  override catch(exception: unknown, host: ArgumentsHost): void {
    if (exception instanceof HttpException || this.isHttpError(exception)) {
      super.catch(exception, host);
      return;
    }

    this.logger.error(describeError(exception), describeErrorStack(exception));

    if (host.getType() === HTTP_CONTEXT) {
      const request = host.switchToHttp().getRequest<FailedRequest>();

      void this.failures.record(
        SERVICE_NAME.SERVER,
        SERVICE_FAILURE_CODE.server.INTERNAL_ERROR,
        serverFailureMessage(request, exception),
      );
    }

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
