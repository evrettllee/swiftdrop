import { MAIL_KIND } from '@/integrations/mail/constants/mail.constants';
import type { MailMessage } from '@/integrations/mail/types/mail.types';
import { AUTH_MAIL_TEXTS, INVITATION_ROLE_LABELS } from '../constants/mail.constants';
import { PASSWORD_LINK_TTL_HOURS } from '../constants/password-links.constants';
import type { InvitationMailInput } from '../types/mail.types';
import { renderSetPasswordHtml } from './set-password.mail';

const TEXTS = AUTH_MAIL_TEXTS.INVITATION;
const LINE_BREAK = '\n';

export function buildInvitationMail(input: InvitationMailInput): MailMessage {
  const greeting = AUTH_MAIL_TEXTS.GREETING(input.firstName);
  const intro = TEXTS.INTRO(INVITATION_ROLE_LABELS[input.roleName], PASSWORD_LINK_TTL_HOURS);

  return {
    kind: MAIL_KIND.INVITATION,
    to: input.to,
    subject: TEXTS.SUBJECT,
    text: [greeting, intro, input.link, TEXTS.OUTRO].join(LINE_BREAK),
    html: renderSetPasswordHtml({
      subject: TEXTS.SUBJECT,
      greeting,
      intro,
      link: input.link,
      closing: TEXTS.OUTRO,
    }),
  };
}
