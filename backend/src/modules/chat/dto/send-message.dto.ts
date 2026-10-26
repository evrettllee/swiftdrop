import { z } from 'zod';
import { MESSAGE_FIELD_LENGTH } from '@/common/constants/field-lengths.constants';
import { CHAT_VALIDATION_MESSAGES, NUL_CHARACTER } from '../constants/chat.constants';

// The length in characters (code points), as char_length counts it in the database: an emoji is
// one character here, while the length of a JS string counts it as two.
function characterCount(value: string): number {
  return Array.from(value).length;
}

// Text only. The text is kept trimmed; its length is checked after the trim. Unknown fields are
// refused.
export const sendMessageSchema = z.strictObject({
  content: z
    .string({ error: CHAT_VALIDATION_MESSAGES.CONTENT_INVALID })
    .trim()
    .refine((content) => characterCount(content) > 0, CHAT_VALIDATION_MESSAGES.CONTENT_EMPTY)
    .refine(
      (content) => characterCount(content) <= MESSAGE_FIELD_LENGTH.CONTENT,
      CHAT_VALIDATION_MESSAGES.CONTENT_TOO_LONG,
    )
    .refine(
      (content) => !content.includes(NUL_CHARACTER),
      CHAT_VALIDATION_MESSAGES.CONTENT_FORBIDDEN_CHARACTER,
    ),
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
