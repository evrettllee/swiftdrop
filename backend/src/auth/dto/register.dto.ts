import { z } from 'zod';
import { buildNameSchema, phoneSchema } from '../../common/schemas/person-fields.schema';
import { AUTH_VALIDATION_MESSAGES } from '../constants/validation';
import { emailSchema, passwordSchema } from './auth-fields';

export const registerSchema = z.object({
  firstName: buildNameSchema(
    AUTH_VALIDATION_MESSAGES.FIRST_NAME_TOO_SHORT,
    AUTH_VALIDATION_MESSAGES.FIRST_NAME_TOO_LONG,
    AUTH_VALIDATION_MESSAGES.FIRST_NAME_INVALID,
  ),
  lastName: buildNameSchema(
    AUTH_VALIDATION_MESSAGES.LAST_NAME_TOO_SHORT,
    AUTH_VALIDATION_MESSAGES.LAST_NAME_TOO_LONG,
    AUTH_VALIDATION_MESSAGES.LAST_NAME_INVALID,
  ),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
});

export type RegisterDto = z.infer<typeof registerSchema>;
