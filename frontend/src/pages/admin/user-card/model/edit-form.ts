import { z } from 'zod';
import { USER_FIELD } from '@/entities/admin-user';
import { formatPhone } from '@/shared/lib/format';
import {
  buildNameSchema,
  buildPhoneSchema,
  PERSON_VALIDATION_MESSAGES as MESSAGES,
} from '@/shared/lib/person-validation';
import type { AdminUserCard } from '../api/admin-user-card';

export const editFormSchema = z.object({
  [USER_FIELD.FIRST_NAME]: buildNameSchema(
    MESSAGES.FIRST_NAME_REQUIRED,
    MESSAGES.FIRST_NAME_TOO_SHORT,
    MESSAGES.FIRST_NAME_TOO_LONG,
    MESSAGES.FIRST_NAME_INVALID,
  ),
  [USER_FIELD.LAST_NAME]: buildNameSchema(
    MESSAGES.LAST_NAME_REQUIRED,
    MESSAGES.LAST_NAME_TOO_SHORT,
    MESSAGES.LAST_NAME_TOO_LONG,
    MESSAGES.LAST_NAME_INVALID,
  ),
  [USER_FIELD.PHONE]: buildPhoneSchema(MESSAGES.PHONE_REQUIRED, MESSAGES.PHONE_INVALID),
});

export function editInitialValues(card: AdminUserCard) {
  return {
    [USER_FIELD.FIRST_NAME]: card.firstName,
    [USER_FIELD.LAST_NAME]: card.lastName,
    [USER_FIELD.PHONE]: card.phone === null ? '' : formatPhone(card.phone),
  };
}
