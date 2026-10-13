import { z } from 'zod';
import { YANDEX_USER_ID_MIN_LENGTH } from '../constants/oauth.constants';

// The part of the Yandex profile that is used.
export const yandexProfileSchema = z.object({
  id: z.string().min(YANDEX_USER_ID_MIN_LENGTH),
  default_email: z.email().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  display_name: z.string().optional(),
  login: z.string().optional(),
});

export type YandexProfile = z.infer<typeof yandexProfileSchema>;
