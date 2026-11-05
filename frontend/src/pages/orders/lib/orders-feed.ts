import type { OrderListItem } from '@/shared/api';
import { LIST_STATUS, type ListStatus } from '@/shared/config';

type FeedPage = {
  items: OrderListItem[];
  nextCursor: string | null;
  total?: number;
};

export type OrdersFeed = {
  key: string;
  status: ListStatus;
  items: OrderListItem[];
  total: number;
  nextCursor: string | null;
  message: string | null;
};

export type OrdersFeedView = Omit<OrdersFeed, 'key' | 'nextCursor'> & { hasMore: boolean };

export const NO_FEED: OrdersFeed = {
  key: '',
  status: LIST_STATUS.LOADING,
  items: [],
  total: 0,
  nextCursor: null,
  message: null,
};

export function startFeed(key: string, page: FeedPage): OrdersFeed {
  return {
    key,
    status: LIST_STATUS.READY,
    items: page.items,
    total: page.total ?? page.items.length,
    nextCursor: page.nextCursor,
    message: null,
  };
}

export function appendFeed(feed: OrdersFeed, key: string, page: FeedPage): OrdersFeed {
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

export function failFeed(feed: OrdersFeed, key: string, message: string): OrdersFeed {
  return feed.key === key
    ? { ...feed, status: LIST_STATUS.ERROR, message }
    : { ...NO_FEED, key, status: LIST_STATUS.ERROR, message };
}

export function feedView(feed: OrdersFeed, key: string): OrdersFeedView {
  const isCurrent = feed.key === key;

  return {
    status: isCurrent ? feed.status : LIST_STATUS.LOADING,
    items: isCurrent ? feed.items : [],
    total: isCurrent ? feed.total : 0,
    message: isCurrent ? feed.message : null,
    hasMore: isCurrent && feed.nextCursor !== null,
  };
}
