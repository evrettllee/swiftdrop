import { useEffect, useRef, useState } from 'react';
import {
  type BusinessAnalytics,
  type DeliveryAnalytics,
  getAdminBusinessAnalytics,
  getAdminDeliveryAnalytics,
  getAdminServiceAnalytics,
  getAdminSupportAnalytics,
  getAdminUsersAnalytics,
  isTooManyRequests,
  type ServiceAnalytics,
  type SupportAnalytics,
  type UsersAnalytics,
} from '@/shared/analytics-api';
import { getApiErrorMessage } from '@/shared/api';
import { ADMIN_ANALYTICS_TAB, type AdminAnalyticsTab } from '../config/tabs';
import { ADMIN_ANALYTICS_TEXTS as TEXTS } from '../config/texts';

export type AdminTabDataMap = {
  business: BusinessAnalytics;
  delivery: DeliveryAnalytics;
  users: UsersAnalytics;
  support: SupportAnalytics;
  service: ServiceAnalytics;
};

export type AdminAnalyticsLoaded = {
  [T in AdminAnalyticsTab]: { tab: T; data: AdminTabDataMap[T] };
}[AdminAnalyticsTab];

type FetchState = {
  requestKey: string;
  loaded: AdminAnalyticsLoaded | null;
  failure: string | null;
};

const FETCHERS = {
  [ADMIN_ANALYTICS_TAB.BUSINESS]: getAdminBusinessAnalytics,
  [ADMIN_ANALYTICS_TAB.DELIVERY]: getAdminDeliveryAnalytics,
  [ADMIN_ANALYTICS_TAB.USERS]: getAdminUsersAnalytics,
  [ADMIN_ANALYTICS_TAB.SUPPORT]: getAdminSupportAnalytics,
  [ADMIN_ANALYTICS_TAB.SERVICE]: getAdminServiceAnalytics,
} as const;

async function loadTabData(
  tab: AdminAnalyticsTab,
  query: { from: string; to: string },
  requestKey: string,
  signal: AbortSignal,
  setState: React.Dispatch<React.SetStateAction<FetchState>>,
): Promise<void> {
  try {
    const data = await FETCHERS[tab](query, { signal });

    if (!signal.aborted) {
      setState({ requestKey, loaded: { tab, data } as AdminAnalyticsLoaded, failure: null });
    }
  } catch (caught) {
    if (!signal.aborted) {
      setState((prev) => ({
        requestKey,
        loaded: prev.loaded?.tab === tab ? prev.loaded : null,
        failure: isTooManyRequests(caught)
          ? TEXTS.TOO_MANY
          : getApiErrorMessage(caught, TEXTS.LOAD_FAILED),
      }));
    }
  }
}

export function useTabFetch(
  tab: AdminAnalyticsTab,
  query: { from: string; to: string } | null,
  requestKey: string,
  debounceMs: number,
) {
  const [state, setState] = useState<FetchState>({
    requestKey: '',
    loaded: null,
    failure: null,
  });
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (query === null) {
      return undefined;
    }

    const controller = new AbortController();
    timerRef.current = window.setTimeout(
      () => void loadTabData(tab, query, requestKey, controller.signal, setState),
      debounceMs,
    );

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      controller.abort();
    };
  }, [tab, query, requestKey, debounceMs]);

  return {
    loaded: state.loaded?.tab === tab ? state.loaded : null,
    failure: state.requestKey === requestKey ? state.failure : null,
    isLoading: query !== null && state.requestKey !== requestKey,
  };
}
