import type { MailMessage } from '../types/mail.types';

export abstract class MailGateway {
  abstract send(message: MailMessage): Promise<void>;
}
