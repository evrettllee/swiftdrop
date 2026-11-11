import {
  ANALYTICS_DEFAULT_COURIER_SORT,
  type AnalyticsPeriodQuery,
  getAnalyticsCouriers,
  getAnalyticsSummary,
} from '@/shared/analytics-api';
import { useListParams } from '@/shared/lib/list-params';
import { TOP_COURIERS_LIMIT } from '../config/analytics';
import { PERIOD_PARAMS_CONFIG } from '../config/params';
import { MANAGER_ANALYTICS_TEXTS } from '../config/texts';
import { useAnalyticsPeriod } from './useAnalyticsPeriod';
import { useAnalyticsRequest } from './useAnalyticsRequest';

function loadSummary(query: AnalyticsPeriodQuery, signal: AbortSignal) {
  return getAnalyticsSummary(query, { signal });
}

function loadTopCouriers(query: AnalyticsPeriodQuery, signal: AbortSignal) {
  return getAnalyticsCouriers(
    { ...query, sort: ANALYTICS_DEFAULT_COURIER_SORT, page: 1, limit: TOP_COURIERS_LIMIT },
    { signal },
  );
}

export function useAnalyticsPage() {
  const { values, update } = useListParams(PERIOD_PARAMS_CONFIG);
  const period = useAnalyticsPeriod(values, update);
  const summary = useAnalyticsRequest(
    period.request,
    loadSummary,
    MANAGER_ANALYTICS_TEXTS.LOAD_FAILED,
  );
  const couriers = useAnalyticsRequest(
    period.request,
    loadTopCouriers,
    MANAGER_ANALYTICS_TEXTS.COURIERS_FAILED,
  );

  return { period, summary, couriers };
}
