import { LIST_STATUS, type ListStatus } from '@/shared/config';

export type CursorPage<T> = { items: T[]; nextCursor: string | null; total?: number };

export type ListFeed<T, P extends CursorPage<T>> = {
  key: string;
  status: ListStatus;
  first: P | null;
  items: T[];
  total: number;
  nextCursor: string | null;
  message: string | null;
};

export type ListFeedView<T, P extends CursorPage<T>> = {
  status: ListStatus;
  first: P | null;
  items: T[];
  total: number;
  message: string | null;
  hasMore: boolean;
};

export function noFeed<T, P extends CursorPage<T>>(): ListFeed<T, P> {
  return {
    key: '',
    status: LIST_STATUS.LOADING,
    first: null,
    items: [],
    total: 0,
    nextCursor: null,
    message: null,
  };
}

export function startFeed<T, P extends CursorPage<T>>(key: string, page: P): ListFeed<T, P> {
  return {
    key,
    status: LIST_STATUS.READY,
    first: page,
    items: page.items,
    total: page.total ?? page.items.length,
    nextCursor: page.nextCursor,
    message: null,
  };
}

export function appendFeed<T, P extends CursorPage<T>>(
  feed: ListFeed<T, P>,
  key: string,
  page: CursorPage<T>,
): ListFeed<T, P> {
  return feed.key === key
    ? {
        ...feed,
        status: LIST_STATUS.READY,
        items: [...feed.items, ...page.items],
        nextCursor: page.nextCursor,
        message: null,
      }
    : feed;
}

export function failFeed<T, P extends CursorPage<T>>(
  feed: ListFeed<T, P>,
  key: string,
  message: string,
): ListFeed<T, P> {
  return feed.key === key
    ? { ...feed, status: LIST_STATUS.ERROR, message }
    : { ...noFeed<T, P>(), key, status: LIST_STATUS.ERROR, message };
}

export function feedView<T, P extends CursorPage<T>>(
  feed: ListFeed<T, P>,
  key: string,
): ListFeedView<T, P> {
  const isCurrent = feed.key === key;

  return {
    status: isCurrent ? feed.status : LIST_STATUS.LOADING,
    first: isCurrent ? feed.first : null,
    items: isCurrent ? feed.items : [],
    total: isCurrent ? feed.total : 0,
    message: isCurrent ? feed.message : null,
    hasMore: isCurrent && feed.nextCursor !== null,
  };
}
