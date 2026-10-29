const LIKE_SPECIAL_CHARACTERS = /[\\%_]/g;

export function escapeLike(text: string): string {
  return text.replace(LIKE_SPECIAL_CHARACTERS, (character) => `\\${character}`);
}
