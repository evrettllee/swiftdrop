import {
  COURIER_ORDERS_API_PATHS,
  type CourierHistoryCursorPage,
  courierHistoryCursorPageSchema,
  type CourierHistoryPage,
  courierHistoryPageSchema,
  http,
} from '@/shared/api';
import { serializeListParam } from '@/shared/lib/list-params';
import { HISTORY_COUNT_PROBE_LIMIT, HISTORY_FIRST_PAGE, HISTORY_PAGE_SIZE } from '../config/list';
import type { HistoryParams } from '../config/list-params';

export type HistoryQuery = Pick<HistoryParams, 'q' | 'from' | 'to' | 'sort'>;

function pathOf(query: HistoryQuery, extra: Record<string, string | number | null>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    const serialized = serializeListParam(value);

    if (serialized !== null) {
      params.set(key, serialized);
    }
  }

  for (const [key, value] of Object.entries(extra)) {
    if (value !== null) {
      params.set(key, String(value));
    }
  }

  return `${COURIER_ORDERS_API_PATHS.HISTORY}?${params}`;
}

export async function getHistoryPage(
  query: HistoryQuery,
  page: number,
  until: number | null,
  signal: AbortSignal,
  limit: number = HISTORY_PAGE_SIZE,
): Promise<CourierHistoryPage> {
  return courierHistoryPageSchema.parse(
    await http.get(pathOf(query, { page, limit, until }), { signal }),
  );
}

export async function getHistoryCursorPage(
  query: HistoryQuery,
  cursor: string,
  signal: AbortSignal,
): Promise<CourierHistoryCursorPage> {
  return courierHistoryCursorPageSchema.parse(
    await http.get(pathOf(query, { cursor, limit: HISTORY_PAGE_SIZE }), { signal }),
  );
}

export async function countHistory(query: HistoryQuery, signal: AbortSignal): Promise<number> {
  const page = await getHistoryPage(
    query,
    HISTORY_FIRST_PAGE,
    null,
    signal,
    HISTORY_COUNT_PROBE_LIMIT,
  );

  return page.total;
}
