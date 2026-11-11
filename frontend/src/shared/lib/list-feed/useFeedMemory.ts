import { useCallback, useEffect, useRef, useState } from 'react';
import { LIST_STATUS } from '@/shared/config';
import type { CachedFeed, FeedCache } from './feed-cache';
import { type CursorPage, type ListFeed, noFeed } from './list-feed';

const SCROLL_EVENT = 'scroll';

function useRestoredFeed<T, P extends CursorPage<T>>(
  cache: FeedCache<T, P> | undefined,
  listKey: string,
): CachedFeed<T, P> | null {
  const [restored] = useState(() => cache?.take(listKey, Date.now()) ?? null);

  useEffect(() => {
    if (restored !== null) {
      window.scrollTo(0, restored.scrollY);
    }
  }, [restored]);

  return restored;
}

export function useInitialFeed<T, P extends CursorPage<T>>(
  cache: FeedCache<T, P> | undefined,
  listKey: string,
  key: string,
) {
  const restored = useRestoredFeed(cache, listKey);
  const restoredKey = useRef(restored === null ? null : key);
  const [feed, setFeed] = useState<ListFeed<T, P>>(() =>
    restored === null ? noFeed() : { ...restored.feed, key },
  );

  const isRestored = useCallback((current: string) => {
    if (restoredKey.current === current) {
      return true;
    }

    restoredKey.current = null;

    return false;
  }, []);

  return { feed, setFeed, isRestored };
}

export function useFeedMemory<T, P extends CursorPage<T>>(
  cache: FeedCache<T, P> | undefined,
  listKey: string,
  feed: ListFeed<T, P>,
  feedKey: string,
): void {
  const latest = useRef({ listKey, feed, feedKey });
  const scrollY = useRef(0);

  useEffect(() => {
    latest.current = { listKey, feed, feedKey };
  });

  useEffect(() => {
    if (cache === undefined) {
      return undefined;
    }

    const track = () => {
      scrollY.current = window.scrollY;
    };

    track();
    window.addEventListener(SCROLL_EVENT, track, { passive: true });

    return () => {
      window.removeEventListener(SCROLL_EVENT, track);
      const { listKey: key, feed: kept, feedKey: keptKey } = latest.current;

      if (kept.key === keptKey && kept.status === LIST_STATUS.READY && kept.items.length > 0) {
        cache.save(key, { feed: kept, scrollY: scrollY.current, savedAt: Date.now() });
      }
    };
  }, [cache]);
}
