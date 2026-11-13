import { z } from 'zod';
import { passwordSchema } from '../schemas/auth-fields.schema';

export const setPasswordSchema = z.object({ password: passwordSchema }).strict();

export type SetPasswordDto = z.infer<typeof setPasswordSchema>;
