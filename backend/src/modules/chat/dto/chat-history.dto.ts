import { z } from 'zod';
import { DB_INTEGER_MAX } from '@/common/constants/database.constants';
import {
  CHAT_PAGE_SIZE_DEFAULT,
  CHAT_PAGE_SIZE_MAX,
  CHAT_PAGE_SIZE_MIN,
  CHAT_VALIDATION_MESSAGES,
} from '../constants/chat.constants';

// Query values arrive as strings, so numbers are coerced. Unknown fields are refused.
export const chatHistorySchema = z.strictObject({
  beforeId: z.coerce
    .number({ error: CHAT_VALIDATION_MESSAGES.BEFORE_ID_INVALID })
    .int(CHAT_VALIDATION_MESSAGES.BEFORE_ID_INVALID)
    .positive(CHAT_VALIDATION_MESSAGES.BEFORE_ID_INVALID)
    .max(DB_INTEGER_MAX, CHAT_VALIDATION_MESSAGES.BEFORE_ID_INVALID)
    .optional(),
  limit: z.coerce
    .number({ error: CHAT_VALIDATION_MESSAGES.LIMIT_INVALID })
    .int(CHAT_VALIDATION_MESSAGES.LIMIT_INVALID)
    .min(CHAT_PAGE_SIZE_MIN, CHAT_VALIDATION_MESSAGES.LIMIT_INVALID)
    .max(CHAT_PAGE_SIZE_MAX, CHAT_VALIDATION_MESSAGES.LIMIT_INVALID)
    .default(CHAT_PAGE_SIZE_DEFAULT),
});

export type ChatHistoryDto = z.infer<typeof chatHistorySchema>;
