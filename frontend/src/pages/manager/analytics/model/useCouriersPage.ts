import { useMemo } from 'react';
import {
  ANALYTICS_COURIERS_LIMIT,
  type AnalyticsCourierSort,
  type AnalyticsCouriersQuery,
  getAnalyticsCouriers,
} from '@/shared/analytics-api';
import { useListParams } from '@/shared/lib/list-params';
import { COURIERS_PARAMS_CONFIG } from '../config/params';
import { MANAGER_ANALYTICS_TEXTS } from '../config/texts';
import { useAnalyticsPeriod } from './useAnalyticsPeriod';
import { useAnalyticsRequest } from './useAnalyticsRequest';

function loadCouriers(query: AnalyticsCouriersQuery, signal: AbortSignal) {
  return getAnalyticsCouriers(query, { signal });
}

export function useCouriersPage() {
  const { values, update } = useListParams(COURIERS_PARAMS_CONFIG);
  const period = useAnalyticsPeriod(values, update);
  const { sort, page } = values;
  const periodRequest = period.request;

  const request = useMemo(
    () =>
      periodRequest === null
        ? null
        : {
            key: `${periodRequest.key}|${sort}|${page}`,
            query: { ...periodRequest.query, sort, page, limit: ANALYTICS_COURIERS_LIMIT },
          },
    [periodRequest, sort, page],
  );

  const couriers = useAnalyticsRequest(
    request,
    loadCouriers,
    MANAGER_ANALYTICS_TEXTS.COURIERS_FAILED,
  );

  return {
    period,
    couriers,
    sort,
    page,
    setSort: (next: AnalyticsCourierSort) => update({ sort: next }),
    setPage: (next: number) => update({ page: next }),
  };
}
