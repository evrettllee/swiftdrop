import { expect, test } from '@playwright/test';
import { LIST_STATUS } from '@/shared/config';
import { createFeedCache, FEED_CACHE_TTL_MS } from './feed-cache';
import type { CursorPage, ListFeed } from './list-feed';

type Page = CursorPage<number>;

const SAVED_AT = Date.parse('2026-11-05T12:00:00Z');

function feedOf(items: number[]): ListFeed<number, Page> {
  return {
    key: 'list|0',
    status: LIST_STATUS.READY,
    first: { items, nextCursor: 'next' },
    items,
    total: 40,
    nextCursor: 'next',
    message: null,
  };
}

test('should give back the shown items, the cursor and the scroll of the same list', () => {
  const cache = createFeedCache<number, Page>();
  const entry = { feed: feedOf([1, 2, 3]), scrollY: 640, savedAt: SAVED_AT };
  cache.save('list', entry);

  expect(cache.take('list', SAVED_AT + 1000)).toEqual(entry);
});

test('should not give a feed of other list parameters', () => {
  const cache = createFeedCache<number, Page>();
  cache.save('list', { feed: feedOf([1]), scrollY: 0, savedAt: SAVED_AT });

  expect(cache.take('list?sort=old', SAVED_AT)).toBeNull();
});

test('should forget a feed after five minutes', () => {
  const cache = createFeedCache<number, Page>();
  cache.save('list', { feed: feedOf([1]), scrollY: 0, savedAt: SAVED_AT });

  expect(cache.take('list', SAVED_AT + FEED_CACHE_TTL_MS)).toBeNull();
  expect(cache.take('list', SAVED_AT)).toBeNull();
});

test('should keep only the last saved list', () => {
  const cache = createFeedCache<number, Page>();
  cache.save('first', { feed: feedOf([1]), scrollY: 0, savedAt: SAVED_AT });
  cache.save('second', { feed: feedOf([2]), scrollY: 0, savedAt: SAVED_AT });

  expect(cache.take('first', SAVED_AT)).toBeNull();
  expect(cache.take('second', SAVED_AT)?.feed.items).toEqual([2]);
});
