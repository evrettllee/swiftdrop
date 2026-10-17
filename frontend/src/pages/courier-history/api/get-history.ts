import { z } from 'zod';
import { COURIER_ORDERS_API_PATHS, courierHistoryPageSchema, http } from '@/shared/api';
import { HISTORY_PAGE_SIZE } from '../config/list';

export type HistoryPage = z.infer<typeof courierHistoryPageSchema>;

type HistoryQuery = {
  page: number;
  limit?: number;
};

// The finished orders of the courier, the newest first.
export async function getHistory(
  { page, limit = HISTORY_PAGE_SIZE }: HistoryQuery,
  signal?: AbortSignal,
): Promise<HistoryPage> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });

  return courierHistoryPageSchema.parse(
    await http.get(`${COURIER_ORDERS_API_PATHS.HISTORY}?${query}`, { signal }),
  );
}
