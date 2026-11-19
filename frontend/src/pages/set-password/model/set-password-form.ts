import { z } from 'zod';
import { newPasswordSchema, PASSWORD_MESSAGES } from '@/features/password-fields';
import { SET_PASSWORD_FIELD } from '../config/forms';

export const setPasswordFormSchema = z
  .object({
    [SET_PASSWORD_FIELD.PASSWORD]: newPasswordSchema,
    [SET_PASSWORD_FIELD.CONFIRM_PASSWORD]: z.string().min(1, PASSWORD_MESSAGES.CONFIRM_REQUIRED),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: [SET_PASSWORD_FIELD.CONFIRM_PASSWORD],
    error: PASSWORD_MESSAGES.MISMATCH,
    when: () => true,
  });
