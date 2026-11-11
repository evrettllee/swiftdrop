import { MANAGER_SEARCH_TEXT_MIN_LENGTH } from './manager-orders-params';

const NUMERIC_SEARCH = /^[\d\s+\-()]+$/;
const DIGIT = /\d/;

export const SEARCH_KIND = {
  NUMBER: 'number',
  TEXT: 'text',
} as const;

export type SearchKind = (typeof SEARCH_KIND)[keyof typeof SEARCH_KIND];

export function searchKindOf(query: string): SearchKind {
  return NUMERIC_SEARCH.test(query) && DIGIT.test(query) ? SEARCH_KIND.NUMBER : SEARCH_KIND.TEXT;
}

export function isSearchUsable(query: string): boolean {
  const trimmed = query.trim();

  return (
    trimmed !== '' &&
    (searchKindOf(trimmed) === SEARCH_KIND.NUMBER ||
      trimmed.length >= MANAGER_SEARCH_TEXT_MIN_LENGTH)
  );
}

export function isSearchTooShort(query: string): boolean {
  return query.trim() !== '' && !isSearchUsable(query);
}
