import { z } from 'zod';
import {
  AUTH_VALIDATION_MESSAGES,
  PASSWORD_LOGIN_MIN_LENGTH,
} from '../constants/validation.constants';
import { emailSchema } from '../schemas/auth-fields.schema';

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(PASSWORD_LOGIN_MIN_LENGTH, AUTH_VALIDATION_MESSAGES.PASSWORD_REQUIRED),
});

export type LoginDto = z.infer<typeof loginSchema>;
