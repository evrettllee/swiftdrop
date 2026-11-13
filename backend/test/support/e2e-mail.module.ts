import { Controller, Get, Module, NotFoundException, Query } from '@nestjs/common';
import { MailGateway } from '@/integrations/mail/contracts/mail.gateway';
import { MailModule } from '@/integrations/mail/mail.module';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { SET_PASSWORD_PATH } from '@/modules/auth/constants/mail.constants';
import { FakeMailGateway } from './mail';

export const E2E_MAIL_ROUTES = {
  BASE: 'e2e/mails',
  LAST: 'last',
  RECIPIENT_PARAM: 'to',
} as const;

const NO_MAIL_MESSAGE = 'No mail to this address';
const SET_PASSWORD_LINK = new RegExp(`https?://\\S+${SET_PASSWORD_PATH}/[A-Za-z0-9_-]+`);

export type E2eLastMail = { subject: string; text: string; link: string | null };

@Controller(E2E_MAIL_ROUTES.BASE)
export class E2eMailController {
  constructor(private readonly mail: MailGateway) {}

  @Public()
  @Get(E2E_MAIL_ROUTES.LAST)
  last(@Query(E2E_MAIL_ROUTES.RECIPIENT_PARAM) to: string | undefined): E2eLastMail {
    const found =
      this.mail instanceof FakeMailGateway && to !== undefined
        ? this.mail.lastMailTo(to)
        : undefined;

    if (found === undefined) {
      throw new NotFoundException(NO_MAIL_MESSAGE);
    }

    return {
      subject: found.subject,
      text: found.text,
      link: SET_PASSWORD_LINK.exec(found.text)?.[0] ?? null,
    };
  }
}

@Module({
  imports: [MailModule],
  controllers: [E2eMailController],
})
export class E2eMailModule {}
