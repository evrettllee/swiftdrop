import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router';
import { type AnalyticsPeriodControlState, useAnalyticsPeriod } from '@/features/analytics-period';
import {
  ANALYTICS_PERIOD,
  PERIOD_DEBOUNCE_MS,
  PERIOD_PARAMS_CONFIG,
  type PeriodParams,
} from '@/shared/lib/calendar';
import { readListParams, writeListParams } from '@/shared/lib/list-params';
import {
  ADMIN_ANALYTICS_TAB_PARAM,
  type AdminAnalyticsTab,
  DEFAULT_ADMIN_ANALYTICS_TAB,
  parseAdminAnalyticsTab,
} from '../config/tabs';
import { type AdminAnalyticsLoaded, useTabFetch } from './useTabFetch';

export type AdminAnalyticsController = {
  tab: AdminAnalyticsTab;
  setTab: (next: AdminAnalyticsTab) => void;
  period: AnalyticsPeriodControlState;
  loaded: AdminAnalyticsLoaded | null;
  isLoading: boolean;
  failure: string | null;
  retry: () => void;
};

export function useAdminAnalytics(): AdminAnalyticsController {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseAdminAnalyticsTab(searchParams.get(ADMIN_ANALYTICS_TAB_PARAM));
  const periodParams = readListParams(searchParams, PERIOD_PARAMS_CONFIG);

  const onPeriodChange = useCallback(
    (patch: Partial<PeriodParams>) => {
      const next = writeListParams(
        new URLSearchParams(),
        { ...periodParams, ...patch },
        PERIOD_PARAMS_CONFIG,
      );

      if (tab !== DEFAULT_ADMIN_ANALYTICS_TAB) {
        next.set(ADMIN_ANALYTICS_TAB_PARAM, tab);
      }

      setSearchParams(next);
    },
    [periodParams, setSearchParams, tab],
  );

  const period = useAnalyticsPeriod(periodParams, onPeriodChange);
  const setTab = useCallback(
    (nextTab: AdminAnalyticsTab) => {
      const next = writeListParams(new URLSearchParams(), periodParams, PERIOD_PARAMS_CONFIG);

      if (nextTab !== DEFAULT_ADMIN_ANALYTICS_TAB) {
        next.set(ADMIN_ANALYTICS_TAB_PARAM, nextTab);
      }

      setSearchParams(next);
    },
    [periodParams, setSearchParams],
  );

  const [retryCount, setRetryCount] = useState(0);
  const isWeek = period.values.period === ANALYTICS_PERIOD.WEEK;
  const requestKey = period.request === null ? '' : `${tab}|${period.request.key}|${retryCount}`;
  const debounceMs = period.values.period === ANALYTICS_PERIOD.CUSTOM ? PERIOD_DEBOUNCE_MS : 0;
  const fetchState = useTabFetch(
    tab,
    period.request?.query ?? null,
    isWeek,
    requestKey,
    debounceMs,
  );

  return {
    tab,
    setTab,
    period,
    ...fetchState,
    retry: () => setRetryCount((count) => count + 1),
  };
}

export type { AdminAnalyticsLoaded };
