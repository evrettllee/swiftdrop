import { MS_PER_MINUTE } from '@/shared/config';
import type { CursorPage, ListFeed } from './list-feed';

export const FEED_CACHE_TTL_MS = 5 * MS_PER_MINUTE;

export type CachedFeed<T, P extends CursorPage<T>> = {
  feed: ListFeed<T, P>;
  scrollY: number;
  savedAt: number;
};

export type FeedCache<T, P extends CursorPage<T>> = {
  save: (key: string, entry: CachedFeed<T, P>) => void;
  take: (key: string, now: number) => CachedFeed<T, P> | null;
};

export function createFeedCache<T, P extends CursorPage<T>>(
  ttlMs: number = FEED_CACHE_TTL_MS,
): FeedCache<T, P> {
  const entries = new Map<string, CachedFeed<T, P>>();

  return {
    save: (key, entry) => {
      entries.clear();
      entries.set(key, entry);
    },
    take: (key, now) => {
      const entry = entries.get(key);

      if (entry === undefined || now - entry.savedAt >= ttlMs) {
        entries.delete(key);

        return null;
      }

      return entry;
    },
  };
}
