import { z } from 'zod';
import { phoneSchema } from '@/common/schemas/person-fields.schema';
import {
  emailSchema,
  firstNameSchema,
  lastNameSchema,
  passwordSchema,
} from '../schemas/auth-fields.schema';

export const registerSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
});

export type RegisterDto = z.infer<typeof registerSchema>;
