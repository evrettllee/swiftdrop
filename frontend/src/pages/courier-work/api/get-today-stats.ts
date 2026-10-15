import {
  COURIERS_API_PATHS,
  type CourierTodayStats,
  courierTodayStatsSchema,
  http,
} from '@/shared/api';

export async function getTodayStats(signal?: AbortSignal): Promise<CourierTodayStats> {
  return courierTodayStatsSchema.parse(await http.get(COURIERS_API_PATHS.STATS_TODAY, { signal }));
}
