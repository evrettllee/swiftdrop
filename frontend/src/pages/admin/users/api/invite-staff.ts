import type { InvitableRole } from '@/entities/admin-user';
import { type PasswordLink, passwordLinkSchema } from '@/features/password-link';
import { http } from '@/shared/api';

export const INVITE_STAFF_API_PATH = '/admin/staff';

export type InviteStaffInput = {
  role: InvitableRole;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type StaffInvite = PasswordLink;

export async function inviteStaff(input: InviteStaffInput): Promise<StaffInvite> {
  return passwordLinkSchema.parse(await http.post(INVITE_STAFF_API_PATH, input));
}
