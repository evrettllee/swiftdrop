import type { NestExpressApplication } from '@nestjs/platform-express';
import { MailGateway } from '@/integrations/mail/contracts/mail.gateway';
import type { MailMessage } from '@/integrations/mail/types/mail.types';

export class FakeMailGateway extends MailGateway {
  readonly sentMails: MailMessage[] = [];

  send(message: MailMessage): Promise<void> {
    this.sentMails.push(message);

    return Promise.resolve();
  }

  clearSentMails(): void {
    this.sentMails.length = 0;
  }

  lastMailTo(address: string): MailMessage | undefined {
    return this.sentMails.findLast((mail) => mail.to === address);
  }
}

export function createMailGatewayMock(): FakeMailGateway {
  return new FakeMailGateway();
}

export function mailGatewayOf(app: NestExpressApplication): FakeMailGateway {
  const gateway = app.get(MailGateway);

  if (!(gateway instanceof FakeMailGateway)) {
    throw new Error('The test app does not use the fake mail gateway');
  }

  return gateway;
}
