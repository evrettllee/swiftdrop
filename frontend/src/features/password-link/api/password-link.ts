import { z } from 'zod';
import { dateSchema } from '@/shared/api';

export const passwordLinkSchema = z.object({
  userId: z.number(),
  email: z.string(),
  setPasswordUrl: z.string(),
  expiresAt: dateSchema,
  emailSent: z.boolean(),
});

export type PasswordLink = z.infer<typeof passwordLinkSchema>;
