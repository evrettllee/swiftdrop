import { z } from 'zod';

export const PASSWORD_LINK_KIND = {
  INVITE: 'invite',
  RESET: 'reset',
} as const;

export const passwordLinkSchema = z.object({
  kind: z.enum([PASSWORD_LINK_KIND.INVITE, PASSWORD_LINK_KIND.RESET]),
  firstName: z.string(),
  email: z.string(),
  role: z.enum(['client', 'courier', 'manager']),
});

export type PasswordLink = z.infer<typeof passwordLinkSchema>;
