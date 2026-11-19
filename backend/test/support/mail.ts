import type { NestExpressApplication } from '@nestjs/platform-express';
import { MailGateway } from '@/integrations/mail/contracts/mail.gateway';
import { MailDeliveryError } from '@/integrations/mail/errors/mail-delivery.error';
import type { MailMessage } from '@/integrations/mail/types/mail.types';

const FAKE_FAILURE_CODE = 'EAUTH';

export class FakeMailGateway extends MailGateway {
  readonly sentMails: MailMessage[] = [];
  private failuresLeft = 0;

  send(message: MailMessage): Promise<void> {
    if (this.failuresLeft > 0) {
      this.failuresLeft -= 1;

      return Promise.reject(new MailDeliveryError(FAKE_FAILURE_CODE));
    }

    this.sentMails.push(message);

    return Promise.resolve();
  }

  failNextSend(): void {
    this.failuresLeft += 1;
  }

  clearSentMails(): void {
    this.sentMails.length = 0;
    this.failuresLeft = 0;
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
