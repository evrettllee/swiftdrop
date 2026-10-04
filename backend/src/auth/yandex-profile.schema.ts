import { z } from 'zod';

export const yandexProfileSchema = z.object({
  id: z.string().min(1),
  default_email: z.email().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  display_name: z.string().optional(),
  login: z.string().optional(),
});

export type YandexProfile = z.infer<typeof yandexProfileSchema>;
