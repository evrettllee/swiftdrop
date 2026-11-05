import { LEGACY_FILTER_PARAM, LEGACY_FILTER_STATUS, STATUS_PARAM } from '../config/list';

export function withoutLegacyFilter(search: URLSearchParams): URLSearchParams | null {
  const filter = search.get(LEGACY_FILTER_PARAM);

  if (filter === null) {
    return null;
  }

  const next = new URLSearchParams(search);
  next.delete(LEGACY_FILTER_PARAM);
  const status = Object.hasOwn(LEGACY_FILTER_STATUS, filter) ? LEGACY_FILTER_STATUS[filter] : null;

  if (status !== null && !next.has(STATUS_PARAM)) {
    next.set(STATUS_PARAM, status);
  }

  return next;
}
