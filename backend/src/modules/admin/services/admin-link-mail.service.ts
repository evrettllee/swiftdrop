import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENV_KEYS } from '@/config/env.constants';
import { MailGateway } from '@/integrations/mail/contracts/mail.gateway';
import type { MailMessage } from '@/integrations/mail/types/mail.types';
import { mailFailureOf } from '@/integrations/mail/utils/mail-failure';
import { SERVICE_NAME } from '@/common/enums/service-name.enum';
import { ServiceFailuresService } from '@/modules/service-failures/services/service-failures.service';
import type { IssuedPasswordLink } from '@/modules/auth/types/password-links.types';
import { buildSetPasswordUrl } from '@/modules/auth/utils/set-password-url';
import { ADMIN_STAFF_LOG_MESSAGES as LOG } from '../constants/admin-staff.constants';
import type { StaffInviteResult } from '../types/admin-staff.types';

type LinkRecipient = { userId: number; email: string };

@Injectable()
export class AdminLinkMailService {
  private readonly logger = new Logger(AdminLinkMailService.name);

  constructor(
    private readonly mail: MailGateway,
    private readonly config: ConfigService,
    private readonly failures: ServiceFailuresService,
  ) {}

  async deliver(
    recipient: LinkRecipient,
    link: IssuedPasswordLink,
    buildMail: (setPasswordUrl: string) => MailMessage,
  ): Promise<StaffInviteResult> {
    const setPasswordUrl = buildSetPasswordUrl(
      this.config.getOrThrow<string>(ENV_KEYS.APP_URL),
      link.token,
    );
    const emailSent = await this.mail.send(buildMail(setPasswordUrl)).then(
      () => true,
      (error: unknown) => {
        const failure = mailFailureOf(error);

        this.logger.error(`${LOG.LINK_MAIL_FAILED}: user ${recipient.userId}, ${failure.message}`);
        void this.failures.record(SERVICE_NAME.MAIL, failure.code, failure.message);

        return false;
      },
    );

    return {
      userId: recipient.userId,
      email: recipient.email,
      setPasswordUrl,
      expiresAt: link.expiresAt,
      emailSent,
    };
  }
}
