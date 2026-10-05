import { z } from 'zod';
import { AUTH_VALIDATION_MESSAGES } from '../auth.constants';
import { buildNameSchema, emailSchema, passwordSchema, phoneSchema } from './auth-fields';

export const registerSchema = z.object({
  firstName: buildNameSchema(
    AUTH_VALIDATION_MESSAGES.FIRST_NAME_TOO_SHORT,
    AUTH_VALIDATION_MESSAGES.FIRST_NAME_TOO_LONG,
  ),
  lastName: buildNameSchema(
    AUTH_VALIDATION_MESSAGES.LAST_NAME_TOO_SHORT,
    AUTH_VALIDATION_MESSAGES.LAST_NAME_TOO_LONG,
  ),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
});

export type RegisterDto = z.infer<typeof registerSchema>;
