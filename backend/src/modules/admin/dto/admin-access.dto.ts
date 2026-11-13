import { z } from 'zod';
import {
  ADMIN_ACCESS_MESSAGES,
  BLOCK_REASON_MAX_LENGTH,
} from '../constants/admin-access.constants';

export const blockUserSchema = z.strictObject({
  reason: z
    .string({ error: ADMIN_ACCESS_MESSAGES.REASON_REQUIRED })
    .trim()
    .min(1, ADMIN_ACCESS_MESSAGES.REASON_REQUIRED)
    .max(BLOCK_REASON_MAX_LENGTH, ADMIN_ACCESS_MESSAGES.REASON_TOO_LONG),
});

export type BlockUserDto = z.infer<typeof blockUserSchema>;
