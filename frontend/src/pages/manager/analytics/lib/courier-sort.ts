import {
  ANALYTICS_COURIER_SORT_KEY,
  ANALYTICS_SORT_DIRECTION,
  type AnalyticsCourierSort,
  type AnalyticsCourierSortKey,
  type AnalyticsSortDirection,
} from '@/shared/analytics-api';
import { TABLE_SORT, type TableSort } from '@/shared/ui/table';

const SORT_SEPARATOR = ':';

export type SortParts = { key: AnalyticsCourierSortKey; direction: AnalyticsSortDirection };

export function sortParts(sort: AnalyticsCourierSort): SortParts {
  const [key, direction] = sort.split(SORT_SEPARATOR);

  return {
    key: key as AnalyticsCourierSortKey,
    direction: direction as AnalyticsSortDirection,
  };
}

function sortOf(key: AnalyticsCourierSortKey, direction: AnalyticsSortDirection) {
  return `${key}${SORT_SEPARATOR}${direction}` as const;
}

export function nextSort(
  current: AnalyticsCourierSort,
  key: AnalyticsCourierSortKey,
): AnalyticsCourierSort {
  const parts = sortParts(current);

  if (parts.key === key) {
    return sortOf(
      key,
      parts.direction === ANALYTICS_SORT_DIRECTION.ASC
        ? ANALYTICS_SORT_DIRECTION.DESC
        : ANALYTICS_SORT_DIRECTION.ASC,
    );
  }

  return sortOf(
    key,
    key === ANALYTICS_COURIER_SORT_KEY.NAME
      ? ANALYTICS_SORT_DIRECTION.ASC
      : ANALYTICS_SORT_DIRECTION.DESC,
  );
}

export function tableSortOf(
  current: AnalyticsCourierSort,
  key: AnalyticsCourierSortKey,
): TableSort | undefined {
  const parts = sortParts(current);

  if (parts.key !== key) {
    return undefined;
  }

  return parts.direction === ANALYTICS_SORT_DIRECTION.ASC
    ? TABLE_SORT.ASCENDING
    : TABLE_SORT.DESCENDING;
}
