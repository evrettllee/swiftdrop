import { useMemo } from 'react';
import {
  type CourierHistoryCursorPage,
  type CourierHistoryItem,
  type CourierHistoryPage,
  getApiErrorMessage,
} from '@/shared/api';
import { DESKTOP_MEDIA_QUERY, LIST_STATUS } from '@/shared/config';
import { calendarDateToUtc, calendarToday } from '@/shared/lib/calendar';
import { useMinuteNow } from '@/shared/lib/clock';
import { useMediaQuery } from '@/shared/lib/dom';
import { createFeedCache, useCursorFeed, usePagedList } from '@/shared/lib/list-feed';
import { LIST_PAGE_SIZE, useListParams } from '@/shared/lib/list-params';
import { getHistoryCursorPage, getHistoryPage, type HistoryQuery } from '../api/get-history';
import { HISTORY_PARAMS_CONFIG, type HistoryParams } from '../config/list-params';
import { HISTORY_TEXTS } from '../config/texts';
import { historyPeriod } from '../lib/history-period';
import { useWholeHistoryCount } from './useHistoryCount';

const HISTORY_FEED_CACHE = createFeedCache<CourierHistoryItem, CourierHistoryCursorPage>();

function messageOf(error: unknown): string {
  return getApiErrorMessage(error, HISTORY_TEXTS.LOAD_ERROR);
}

function useHistoryQuery({ period, from, to, q, sort, status }: HistoryParams) {
  const today = calendarToday(new Date(useMinuteNow()));
  const now = useMemo(() => calendarDateToUtc(today), [today]);
  const range = useMemo(() => historyPeriod({ period, from, to }, now), [period, from, to, now]);
  const query = useMemo<HistoryQuery>(
    () => ({ q, from: range.from, to: range.to, sort, status }),
    [q, range, sort, status],
  );

  return { now, range, query };
}

export function useHistory() {
  const params = useListParams<HistoryParams>(HISTORY_PARAMS_CONFIG);
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const { now, range, query } = useHistoryQuery(params.values);
  const key = JSON.stringify(query);
  const pages = usePagedList<CourierHistoryItem, CourierHistoryPage>({
    key,
    page: params.values.page,
    pageSize: LIST_PAGE_SIZE,
    until: params.until,
    onUntil: params.setUntil,
    isEnabled: isDesktop,
    load: (page, until, signal) => getHistoryPage(query, page, until, signal),
    messageOf,
  });
  const feed = useCursorFeed<CourierHistoryItem, CourierHistoryCursorPage>({
    key,
    isEnabled: !isDesktop,
    load: (cursor, signal) => getHistoryCursorPage(query, cursor, signal),
    messageOf,
    cache: HISTORY_FEED_CACHE,
  });
  const wholeCount = useWholeHistoryCount();
  const list = isDesktop ? pages : feed;
  const summary = (isDesktop ? pages.answer?.summary : feed.first?.summary) ?? null;

  return {
    params,
    isDesktop,
    now,
    range,
    query,
    pages,
    feed,
    summary,
    hasNoHistory: wholeCount === 0,
    isEmpty: list.status === LIST_STATUS.READY && list.items.length === 0,
  };
}

export type HistoryState = ReturnType<typeof useHistory>;
