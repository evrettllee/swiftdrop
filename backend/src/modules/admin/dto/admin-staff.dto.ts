import { z } from 'zod';
import { phoneSchema } from '@/common/schemas/person-fields.schema';
import { INVITABLE_ROLES } from '@/modules/auth/constants/mail.constants';
import {
  emailSchema,
  firstNameSchema,
  lastNameSchema,
} from '@/modules/auth/schemas/auth-fields.schema';
import { ADMIN_STAFF_MESSAGES } from '../constants/admin-staff.constants';

export const inviteStaffSchema = z.strictObject({
  role: z.enum(INVITABLE_ROLES, { error: ADMIN_STAFF_MESSAGES.ROLE_INVALID }),
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  phone: phoneSchema,
});

export type InviteStaffDto = z.infer<typeof inviteStaffSchema>;

export const updateStaffSchema = z
  .strictObject({
    firstName: firstNameSchema.optional(),
    lastName: lastNameSchema.optional(),
    phone: phoneSchema.optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: ADMIN_STAFF_MESSAGES.NOTHING_TO_UPDATE,
  });

export type UpdateStaffDto = z.infer<typeof updateStaffSchema>;

export const changeRoleSchema = z.strictObject(
  { role: z.enum(INVITABLE_ROLES, { error: ADMIN_STAFF_MESSAGES.ROLE_INVALID }) },
  { error: ADMIN_STAFF_MESSAGES.ROLE_INVALID },
);

export type ChangeRoleDto = z.infer<typeof changeRoleSchema>;
