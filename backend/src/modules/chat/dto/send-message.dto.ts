import { z } from 'zod';
import { MESSAGE_FIELD_LENGTH } from '../../../common/constants/field-lengths.constants';
import { CHAT_VALIDATION_MESSAGES, NUL_CHARACTER } from '../constants/chat.constants';

// Text only. The text is kept trimmed; its length is checked after the trim. Unknown fields are
// refused.
export const sendMessageSchema = z.strictObject({
  content: z
    .string({ error: CHAT_VALIDATION_MESSAGES.CONTENT_INVALID })
    .trim()
    .min(1, CHAT_VALIDATION_MESSAGES.CONTENT_EMPTY)
    .max(MESSAGE_FIELD_LENGTH.CONTENT, CHAT_VALIDATION_MESSAGES.CONTENT_TOO_LONG)
    .refine(
      (content) => !content.includes(NUL_CHARACTER),
      CHAT_VALIDATION_MESSAGES.CONTENT_FORBIDDEN_CHARACTER,
    ),
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
