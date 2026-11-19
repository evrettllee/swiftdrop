import type { InvitableRole } from '../constants/mail.constants';

type MailLinkFields = {
  to: string;
  firstName: string;
  link: string;
};

export type InvitationMailInput = MailLinkFields & {
  roleName: InvitableRole;
};

export type PasswordResetByAdminMailInput = MailLinkFields & {
  expiresAt: Date;
};
