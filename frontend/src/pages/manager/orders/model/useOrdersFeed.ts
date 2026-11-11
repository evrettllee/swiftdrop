import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  getManagerOrdersCursorPage,
  LIST_CURSOR_FIRST,
  type ManagerOrderListItem,
  type ManagerOrdersCursorPage,
  type ManagerOrdersListQuery,
} from '@/shared/staff-api';
import { LIST_STATUS, type ListStatus } from '@/shared/config';
import { fetchOutcome, type FetchOutcome } from './orders-fetch';

type FeedState = {
  key: string;
  status: ListStatus;
  items: ManagerOrderListItem[];
  total: number;
  nextCursor: string | null;
  message: string | null;
};

const NO_FEED: FeedState = {
  key: '',
  status: LIST_STATUS.LOADING,
  items: [],
  total: 0,
  nextCursor: null,
  message: null,
};

function firstFeed(key: string, outcome: FetchOutcome<ManagerOrdersCursorPage>): FeedState {
  return outcome.data === null
    ? { ...NO_FEED, key, status: LIST_STATUS.ERROR, message: outcome.message }
    : {
        key,
        status: LIST_STATUS.READY,
        items: outcome.data.items,
        total: outcome.data.total ?? outcome.data.items.length,
        nextCursor: outcome.data.nextCursor,
        message: null,
      };
}

function nextFeed(previous: FeedState, outcome: FetchOutcome<ManagerOrdersCursorPage>): FeedState {
  return outcome.data === null
    ? { ...previous, status: LIST_STATUS.ERROR, message: outcome.message }
    : {
        ...previous,
        status: LIST_STATUS.READY,
        items: [...previous.items, ...outcome.data.items],
        nextCursor: outcome.data.nextCursor,
      };
}

type FeedRequest = { key: string; query: ManagerOrdersListQuery; limit: number };

function useShowMore(
  feed: FeedState,
  request: FeedRequest,
  setFeed: Dispatch<SetStateAction<FeedState>>,
) {
  const moreRef = useRef<AbortController | null>(null);

  useEffect(() => () => moreRef.current?.abort(), [request.key]);

  return useCallback(() => {
    const cursor = feed.nextCursor;

    if (cursor === null || feed.key !== request.key) {
      return;
    }

    moreRef.current?.abort();
    const controller = new AbortController();
    moreRef.current = controller;
    setFeed((previous) => ({ ...previous, status: LIST_STATUS.LOADING, message: null }));
    const pagination = { mode: 'cursor', cursor, limit: request.limit } as const;

    void fetchOutcome(() =>
      getManagerOrdersCursorPage(request.query, pagination, controller.signal),
    ).then((outcome) => {
      if (!controller.signal.aborted) {
        setFeed((previous) =>
          previous.key === request.key ? nextFeed(previous, outcome) : previous,
        );
      }
    });
  }, [feed.nextCursor, feed.key, request, setFeed]);
}

type OrdersFeedOptions = {
  query: ManagerOrdersListQuery;
  limit: number;
  isEnabled: boolean;
};

export function useOrdersFeed({ query, limit, isEnabled }: OrdersFeedOptions) {
  const [reloads, setReloads] = useState(0);
  const [feed, setFeed] = useState<FeedState>(NO_FEED);
  const key = JSON.stringify([query, limit, reloads]);
  const request = { key, query, limit };

  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    const controller = new AbortController();
    const pagination = { mode: 'cursor', cursor: LIST_CURSOR_FIRST, limit } as const;

    void fetchOutcome(() => getManagerOrdersCursorPage(query, pagination, controller.signal)).then(
      (outcome) => {
        if (!controller.signal.aborted) {
          setFeed(firstFeed(key, outcome));
        }
      },
    );

    return () => controller.abort();
  }, [key, query, limit, isEnabled]);

  const showMore = useShowMore(feed, request, setFeed);
  const reload = useCallback(() => setReloads((count) => count + 1), []);
  const isCurrent = feed.key === key;

  return {
    status: isCurrent ? feed.status : LIST_STATUS.LOADING,
    items: isCurrent ? feed.items : [],
    total: isCurrent ? feed.total : 0,
    message: isCurrent ? feed.message : null,
    hasMore: isCurrent && feed.nextCursor !== null,
    hasExtraPages: isCurrent && feed.items.length > limit,
    showMore,
    reload,
  };
}
