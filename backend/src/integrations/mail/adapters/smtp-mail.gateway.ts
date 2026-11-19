import { Logger } from '@nestjs/common';
import { MAIL_LOG_MESSAGES, MAIL_UNKNOWN_ERROR_CODE } from '../constants/mail.constants';
import { MailGateway } from '../contracts/mail.gateway';
import { MailDeliveryError } from '../errors/mail-delivery.error';
import type { MailMessage, MailTransport } from '../types/mail.types';

function errorCodeOf(error: unknown): string {
  const code: unknown =
    typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;

  return typeof code === 'string' && code.length > 0 ? code : MAIL_UNKNOWN_ERROR_CODE;
}

export class SmtpMailGateway extends MailGateway {
  private readonly logger = new Logger(SmtpMailGateway.name);

  constructor(
    private readonly transport: MailTransport,
    private readonly from: string,
  ) {
    super();
  }

  async send(message: MailMessage): Promise<void> {
    try {
      await this.transport.sendMail({
        from: this.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
    } catch (error) {
      const code = errorCodeOf(error);

      this.logger.error(`${MAIL_LOG_MESSAGES.NOT_SENT}: ${message.kind}, code ${code}`);

      throw new MailDeliveryError(code);
    }
  }
}
