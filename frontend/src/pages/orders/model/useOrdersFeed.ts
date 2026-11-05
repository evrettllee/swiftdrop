import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '@/shared/api';
import { LIST_STATUS } from '@/shared/config';
import { getOrdersCursorPage, type OrdersQuery } from '../api/list-orders';
import { ORDERS_CURSOR_FIRST } from '../config/list';
import { ORDERS_TEXTS } from '../config/texts';
import { appendFeed, failFeed, feedView, NO_FEED, startFeed } from '../lib/orders-feed';

type CursorPage = Awaited<ReturnType<typeof getOrdersCursorPage>>;

function loadPage(
  query: OrdersQuery,
  cursor: string,
  { signal }: AbortController,
  onPage: (page: CursorPage) => void,
  onError: (message: string) => void,
): void {
  getOrdersCursorPage(query, cursor, signal).then(
    (page) => {
      if (!signal.aborted) {
        onPage(page);
      }
    },
    (error: unknown) => {
      if (!signal.aborted) {
        onError(getApiErrorMessage(error, ORDERS_TEXTS.LIST_FAILED));
      }
    },
  );
}

type OrdersFeedOptions = { query: OrdersQuery; isEnabled: boolean };

export function useOrdersFeed({ query, isEnabled }: OrdersFeedOptions) {
  const [reloads, setReloads] = useState(0);
  const [feed, setFeed] = useState(NO_FEED);
  const moreRef = useRef<AbortController | null>(null);
  const key = JSON.stringify([query, reloads]);

  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    const controller = new AbortController();
    moreRef.current?.abort();

    loadPage(
      query,
      ORDERS_CURSOR_FIRST,
      controller,
      (page) => setFeed(startFeed(key, page)),
      (message) => setFeed(failFeed(NO_FEED, key, message)),
    );

    return () => controller.abort();
  }, [key, query, isEnabled]);

  useEffect(() => () => moreRef.current?.abort(), []);

  const showMore = useCallback(() => {
    if (feed.key !== key || feed.nextCursor === null) {
      return;
    }

    const controller = new AbortController();
    moreRef.current?.abort();
    moreRef.current = controller;
    setFeed((previous) => ({ ...previous, status: LIST_STATUS.LOADING, message: null }));

    loadPage(
      query,
      feed.nextCursor,
      controller,
      (page) => setFeed((previous) => appendFeed(previous, key, page)),
      (message) => setFeed((previous) => failFeed(previous, key, message)),
    );
  }, [feed.key, feed.nextCursor, key, query]);

  const retry = useCallback(() => {
    if (feed.key === key && feed.items.length > 0) {
      showMore();
    } else {
      setReloads((count) => count + 1);
    }
  }, [feed.key, feed.items.length, key, showMore]);

  return { ...feedView(feed, key), showMore, retry };
}
