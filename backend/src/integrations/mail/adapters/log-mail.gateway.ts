import { Logger } from '@nestjs/common';
import { MAIL_LOG_MESSAGES } from '../constants/mail.constants';
import { MailGateway } from '../contracts/mail.gateway';
import type { MailMessage } from '../types/mail.types';

export class LogMailGateway extends MailGateway {
  private readonly logger = new Logger(LogMailGateway.name);

  send(message: MailMessage): Promise<void> {
    this.logger.log(`${MAIL_LOG_MESSAGES.SUPPRESSED}: ${message.kind}`);

    return Promise.resolve();
  }
}
