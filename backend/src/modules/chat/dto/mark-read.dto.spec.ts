import { DB_INTEGER_MAX } from '@/common/constants/database.constants';
import { CHAT_VALIDATION_MESSAGES } from '../constants/chat.constants';
import { markReadSchema } from './mark-read.dto';

function refusal(body: unknown): string | undefined {
  const result = markReadSchema.safeParse(body);

  return result.success ? undefined : result.error.issues[0]?.message;
}

describe('markReadSchema', () => {
  it.each([1, 42, DB_INTEGER_MAX])('should take message id %i', (upToMessageId) => {
    expect(markReadSchema.parse({ upToMessageId })).toEqual({ upToMessageId });
  });

  it.each([
    ['zero', 0],
    ['a negative id', -5],
    ['a fraction', 1.5],
    ['an id past the integer column', DB_INTEGER_MAX + 1],
    ['a numeric string', '7'],
    ['null', null],
  ])('should refuse %s', (_, upToMessageId) => {
    expect(refusal({ upToMessageId })).toBe(CHAT_VALIDATION_MESSAGES.UP_TO_MESSAGE_ID_INVALID);
  });

  it('should refuse a body without the id', () => {
    expect(refusal({})).toBe(CHAT_VALIDATION_MESSAGES.UP_TO_MESSAGE_ID_INVALID);
  });

  it('should refuse an unknown field', () => {
    expect(refusal({ upToMessageId: 3, orderId: 9 })).toBeDefined();
  });
});
