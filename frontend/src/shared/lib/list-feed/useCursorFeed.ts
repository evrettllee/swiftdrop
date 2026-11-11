import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { LIST_STATUS } from '@/shared/config';
import {
  appendFeed,
  type CursorPage,
  failFeed,
  feedView,
  type ListFeed,
  noFeed,
  startFeed,
} from './list-feed';
import type { FeedCache } from './feed-cache';
import { useFeedMemory, useInitialFeed } from './useFeedMemory';

export const LIST_CURSOR_FIRST = '';

type CursorFeedOptions<T, P extends CursorPage<T>> = {
  key: string;
  isEnabled: boolean;
  load: (cursor: string, signal: AbortSignal) => Promise<P>;
  messageOf: (error: unknown) => string;
  cache?: FeedCache<T, P>;
};

function run<T, P extends CursorPage<T>>(
  options: CursorFeedOptions<T, P>,
  cursor: string,
  { signal }: AbortController,
  onPage: (page: P) => void,
  onError: (message: string) => void,
): void {
  options.load(cursor, signal).then(
    (page) => {
      if (!signal.aborted) {
        onPage(page);
      }
    },
    (error: unknown) => {
      if (!signal.aborted) {
        onError(options.messageOf(error));
      }
    },
  );
}

function useLatest<V>(value: V) {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  });

  return ref;
}

function useShowMore<T, P extends CursorPage<T>>(
  feed: ListFeed<T, P>,
  key: string,
  latest: RefObject<CursorFeedOptions<T, P>>,
  setFeed: Dispatch<SetStateAction<ListFeed<T, P>>>,
) {
  const moreRef = useRef<AbortController | null>(null);
  const abortMore = useCallback(() => moreRef.current?.abort(), []);

  useEffect(() => abortMore, [abortMore]);

  const showMore = useCallback(() => {
    const cursor = feed.nextCursor;

    if (feed.key !== key || cursor === null) {
      return;
    }

    const controller = new AbortController();
    abortMore();
    moreRef.current = controller;
    setFeed((previous) => ({ ...previous, status: LIST_STATUS.LOADING, message: null }));
    run(
      latest.current,
      cursor,
      controller,
      (page) => setFeed((previous) => appendFeed(previous, key, page)),
      (message) => setFeed((previous) => failFeed(previous, key, message)),
    );
  }, [feed.key, feed.nextCursor, key, latest, setFeed, abortMore]);

  return { showMore, abortMore };
}

export function useCursorFeed<T, P extends CursorPage<T>>(options: CursorFeedOptions<T, P>) {
  const [reloads, setReloads] = useState(0);
  const key = `${options.key}|${reloads}`;
  const { feed, setFeed, isRestored } = useInitialFeed(options.cache, options.key, key);
  const latest = useLatest(options);
  const { isEnabled } = options;
  const { showMore, abortMore } = useShowMore(feed, key, latest, setFeed);
  useFeedMemory(options.cache, options.key, feed, key);

  useEffect(() => {
    if (!isEnabled || isRestored(key)) {
      return undefined;
    }

    const controller = new AbortController();
    abortMore();
    run(
      latest.current,
      LIST_CURSOR_FIRST,
      controller,
      (page) => setFeed(startFeed<T, P>(key, page)),
      (message) => setFeed(failFeed(noFeed<T, P>(), key, message)),
    );

    return () => controller.abort();
  }, [key, isEnabled, latest, isRestored, setFeed, abortMore]);

  const retry = useCallback(() => {
    if (feed.key === key && feed.items.length > 0) {
      showMore();
    } else {
      setReloads((count) => count + 1);
    }
  }, [feed.key, feed.items.length, key, showMore]);

  return { ...feedView(feed, key), showMore, retry };
}
