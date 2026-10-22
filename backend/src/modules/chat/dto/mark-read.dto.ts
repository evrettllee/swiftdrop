import { z } from 'zod';
import { DB_INTEGER_MAX } from '../../../common/constants/database.constants';
import { CHAT_VALIDATION_MESSAGES } from '../constants/chat.constants';

// The messages to the current user are marked read up to this id. Unknown fields are refused.
export const markReadSchema = z.strictObject({
  upToMessageId: z
    .number({ error: CHAT_VALIDATION_MESSAGES.UP_TO_MESSAGE_ID_INVALID })
    .int(CHAT_VALIDATION_MESSAGES.UP_TO_MESSAGE_ID_INVALID)
    .positive(CHAT_VALIDATION_MESSAGES.UP_TO_MESSAGE_ID_INVALID)
    .max(DB_INTEGER_MAX, CHAT_VALIDATION_MESSAGES.UP_TO_MESSAGE_ID_INVALID),
});

export type MarkReadDto = z.infer<typeof markReadSchema>;
