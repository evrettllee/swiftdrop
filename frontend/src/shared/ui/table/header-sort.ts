import { TABLE_SORT, type TableSort } from './table-options';

export const HEADER_SORT_DIRECTION = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export type HeaderSortDirection =
  (typeof HEADER_SORT_DIRECTION)[keyof typeof HEADER_SORT_DIRECTION];

export type HeaderSortValue<K extends string> = `${K}:${HeaderSortDirection}`;

const SORT_SEPARATOR = ':';

function partsOf(sort: string): { key: string; direction: string } {
  const [key = '', direction = ''] = sort.split(SORT_SEPARATOR);

  return { key, direction };
}

export function nextHeaderSort<K extends string>(
  current: string,
  key: K,
  firstDirection: HeaderSortDirection = HEADER_SORT_DIRECTION.DESC,
): HeaderSortValue<K> {
  const parts = partsOf(current);

  if (parts.key !== key) {
    return `${key}${SORT_SEPARATOR}${firstDirection}`;
  }

  return parts.direction === HEADER_SORT_DIRECTION.ASC
    ? `${key}${SORT_SEPARATOR}${HEADER_SORT_DIRECTION.DESC}`
    : `${key}${SORT_SEPARATOR}${HEADER_SORT_DIRECTION.ASC}`;
}

export function headerSortState(current: string, key: string): TableSort | undefined {
  const parts = partsOf(current);

  if (parts.key !== key) {
    return undefined;
  }

  return parts.direction === HEADER_SORT_DIRECTION.ASC
    ? TABLE_SORT.ASCENDING
    : TABLE_SORT.DESCENDING;
}
