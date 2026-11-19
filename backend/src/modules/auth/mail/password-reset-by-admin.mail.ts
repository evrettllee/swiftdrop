import { MAIL_KIND } from '@/integrations/mail/constants/mail.constants';
import type { MailMessage } from '@/integrations/mail/types/mail.types';
import { AUTH_MAIL_TEXTS } from '../constants/mail.constants';
import type { PasswordResetByAdminMailInput } from '../types/mail.types';
import { buildSetPasswordMail } from './set-password.mail';

const TEXTS = AUTH_MAIL_TEXTS.PASSWORD_RESET_BY_ADMIN;

export function buildPasswordResetByAdminMail(input: PasswordResetByAdminMailInput): MailMessage {
  return buildSetPasswordMail({
    kind: MAIL_KIND.PASSWORD_RESET_BY_ADMIN,
    to: input.to,
    subject: TEXTS.SUBJECT,
    firstName: input.firstName,
    intro: TEXTS.INTRO,
    action: TEXTS.ACTION,
    link: input.link,
    expiresAt: input.expiresAt,
  });
}
