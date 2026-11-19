import { z } from 'zod';
import type { InvitableRole } from '../config/admin-user';
import { dateSchema, http } from '@/shared/api';

export const INVITE_STAFF_API_PATH = '/admin/staff';

export type InviteStaffInput = {
  role: InvitableRole;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

const staffInviteSchema = z.object({
  userId: z.number(),
  email: z.string(),
  setPasswordUrl: z.string(),
  expiresAt: dateSchema,
  emailSent: z.boolean(),
});

export type StaffInvite = z.infer<typeof staffInviteSchema>;

export async function inviteStaff(input: InviteStaffInput): Promise<StaffInvite> {
  return staffInviteSchema.parse(await http.post(INVITE_STAFF_API_PATH, input));
}
