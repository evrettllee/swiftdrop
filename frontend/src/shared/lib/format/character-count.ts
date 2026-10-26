// The length of a text in characters as a database counts them: code points, so an emoji is one
// character, while the length of a JS string counts it as two. The spaces around the text are not
// counted: the backend keeps it trimmed.
export function countCharacters(text: string): number {
  return Array.from(text.trim()).length;
}
