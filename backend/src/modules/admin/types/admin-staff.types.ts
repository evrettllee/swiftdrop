import type { InvitableRole } from '@/modules/auth/constants/mail.constants';
import type { IssuedPasswordLink } from '@/modules/auth/types/password-links.types';

export type StaffInviteResult = {
  userId: number;
  email: string;
  setPasswordUrl: string;
  expiresAt: Date;
  emailSent: boolean;
};

export type InvitedStaffMember = {
  userId: number;
  email: string;
  firstName: string;
  role: InvitableRole;
};

export type IssuedInvite = {
  member: InvitedStaffMember;
  link: IssuedPasswordLink;
};
