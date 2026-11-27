import { z } from 'zod';
import { PASSWORD_MAX_LENGTH, PASSWORD_MESSAGES, PASSWORD_RULES } from '../config/password-rules';

export const newPasswordSchema = z
  .string()
  .min(1, PASSWORD_MESSAGES.REQUIRED)
  .max(PASSWORD_MAX_LENGTH, PASSWORD_MESSAGES.TOO_LONG)
  .refine((value) => PASSWORD_RULES.every((rule) => rule.isMet(value)), PASSWORD_MESSAGES.WEAK);
