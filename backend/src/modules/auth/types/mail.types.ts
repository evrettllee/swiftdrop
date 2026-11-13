import type { InvitableRole } from '../constants/mail.constants';

type SetPasswordMailFields = {
  to: string;
  firstName: string;
  link: string;
  expiresAt: Date;
};

export type InvitationMailInput = SetPasswordMailFields & {
  roleName: InvitableRole;
};

export type PasswordResetByAdminMailInput = SetPasswordMailFields;
