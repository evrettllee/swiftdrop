import { CHAT_MESSAGE_MAX_LENGTH } from '@/shared/config';
import { countCharacters } from '@/shared/lib/format';

export function limitMessageText(text: string): string {
  const characters = Array.from(text);

  return characters.length > CHAT_MESSAGE_MAX_LENGTH
    ? characters.slice(0, CHAT_MESSAGE_MAX_LENGTH).join('')
    : text;
}

export function isSendableText(text: string): boolean {
  const length = countCharacters(text);

  return length > 0 && length <= CHAT_MESSAGE_MAX_LENGTH;
}
