const GRAPHEMES = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

export function firstGraphemes(text: string, count: number): string {
  return Array.from(GRAPHEMES.segment(text), ({ segment }) => segment)
    .slice(0, count)
    .join('');
}

export function shortPersonName(firstName: string, lastName: string): string {
  return lastName === '' ? firstName : `${firstName} ${firstGraphemes(lastName, 1)}.`;
}

export function fullPersonName(firstName: string, lastName: string): string {
  return lastName === '' ? firstName : `${firstName} ${lastName}`;
}
