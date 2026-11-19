import { z } from 'zod';
import { INVITABLE_ROLES, MANAGED_ROLE } from '../config/admin-user';
import {
  buildEmailSchema,
  buildNameSchema,
  buildPhoneSchema,
  PERSON_VALIDATION_MESSAGES as MESSAGES,
} from '@/shared/lib/person-validation';

export const INVITE_FIELD = {
  ROLE: 'role',
  FIRST_NAME: 'firstName',
  LAST_NAME: 'lastName',
  EMAIL: 'email',
  PHONE: 'phone',
} as const;

export const INVITE_INITIAL_VALUES = {
  [INVITE_FIELD.ROLE]: MANAGED_ROLE.COURIER,
  [INVITE_FIELD.FIRST_NAME]: '',
  [INVITE_FIELD.LAST_NAME]: '',
  [INVITE_FIELD.EMAIL]: '',
  [INVITE_FIELD.PHONE]: '',
};

export const inviteFormSchema = z.object({
  [INVITE_FIELD.ROLE]: z.enum(INVITABLE_ROLES),
  [INVITE_FIELD.FIRST_NAME]: buildNameSchema(
    MESSAGES.FIRST_NAME_REQUIRED,
    MESSAGES.FIRST_NAME_TOO_SHORT,
    MESSAGES.FIRST_NAME_TOO_LONG,
    MESSAGES.FIRST_NAME_INVALID,
  ),
  [INVITE_FIELD.LAST_NAME]: buildNameSchema(
    MESSAGES.LAST_NAME_REQUIRED,
    MESSAGES.LAST_NAME_TOO_SHORT,
    MESSAGES.LAST_NAME_TOO_LONG,
    MESSAGES.LAST_NAME_INVALID,
  ),
  [INVITE_FIELD.EMAIL]: buildEmailSchema(
    MESSAGES.EMAIL_REQUIRED,
    MESSAGES.EMAIL_INVALID,
    MESSAGES.EMAIL_TOO_LONG,
  ),
  [INVITE_FIELD.PHONE]: buildPhoneSchema(MESSAGES.PHONE_REQUIRED, MESSAGES.PHONE_INVALID),
});
