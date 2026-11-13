import { MAIL_KIND } from '@/integrations/mail/constants/mail.constants';
import type { MailMessage } from '@/integrations/mail/types/mail.types';
import { AUTH_MAIL_TEXTS, INVITATION_ROLE_LABELS } from '../constants/mail.constants';
import type { InvitationMailInput } from '../types/mail.types';
import { buildSetPasswordMail } from './set-password.mail';

const TEXTS = AUTH_MAIL_TEXTS.INVITATION;

export function buildInvitationMail(input: InvitationMailInput): MailMessage {
  return buildSetPasswordMail({
    kind: MAIL_KIND.INVITATION,
    to: input.to,
    subject: TEXTS.SUBJECT,
    firstName: input.firstName,
    intro: TEXTS.INTRO(INVITATION_ROLE_LABELS[input.roleName]),
    action: TEXTS.ACTION,
    link: input.link,
    expiresAt: input.expiresAt,
    outro: TEXTS.OUTRO,
  });
}
