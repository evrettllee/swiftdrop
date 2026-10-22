import { MESSAGE_FIELD_LENGTH } from '../../../common/constants/field-lengths.constants';
import { CHAT_VALIDATION_MESSAGES } from '../constants/chat.constants';
import { sendMessageSchema } from './send-message.dto';

const LONGEST = 'ж'.repeat(MESSAGE_FIELD_LENGTH.CONTENT);

function refusal(body: unknown): string | undefined {
  const result = sendMessageSchema.safeParse(body);

  return result.success ? undefined : result.error.issues[0]?.message;
}

describe('sendMessageSchema', () => {
  it('should keep the text trimmed', () => {
    expect(sendMessageSchema.parse({ content: '  Привет, я у подъезда \n' })).toEqual({
      content: 'Привет, я у подъезда',
    });
  });

  it.each([
    ['empty', ''],
    ['only spaces', ' \t\n  '],
  ])('should refuse an %s text', (_, content) => {
    expect(refusal({ content })).toBe(CHAT_VALIDATION_MESSAGES.CONTENT_EMPTY);
  });

  it('should take 1000 Cyrillic characters, also with spaces around them', () => {
    expect(sendMessageSchema.parse({ content: ` ${LONGEST} ` }).content).toBe(LONGEST);
  });

  it('should refuse 1001 Cyrillic characters', () => {
    expect(refusal({ content: `${LONGEST}ж` })).toBe(CHAT_VALIDATION_MESSAGES.CONTENT_TOO_LONG);
  });

  // An emoji is two units of a JS string and one character for the database.
  it('should take 1000 emoji and refuse 1001, counting characters as the database does', () => {
    const emoji = '📦'.repeat(MESSAGE_FIELD_LENGTH.CONTENT);

    expect(sendMessageSchema.parse({ content: emoji }).content).toBe(emoji);
    expect(refusal({ content: `${emoji}📦` })).toBe(CHAT_VALIDATION_MESSAGES.CONTENT_TOO_LONG);
  });

  it('should refuse the NUL character, which Postgres text cannot hold', () => {
    expect(refusal({ content: 'до\u0000после' })).toBe(
      CHAT_VALIDATION_MESSAGES.CONTENT_FORBIDDEN_CHARACTER,
    );
  });

  it('should refuse an unknown field', () => {
    expect(
      refusal({ content: 'Привет', attachmentUrl: 'https://example.com/a.png' }),
    ).toBeDefined();
  });

  it.each([
    ['a number', { content: 42 }],
    ['an array', { content: ['Привет'] }],
    ['null', { content: null }],
    ['no field', {}],
  ])('should refuse %s', (_, body) => {
    expect(refusal(body)).toBe(CHAT_VALIDATION_MESSAGES.CONTENT_INVALID);
  });
});
