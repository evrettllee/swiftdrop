import { useCallback, useEffect, useRef, useState } from 'react';
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

export const LIST_CURSOR_FIRST = '';

type CursorFeedOptions<P> = {
  key: string;
  isEnabled: boolean;
  load: (cursor: string, signal: AbortSignal) => Promise<P>;
  messageOf: (error: unknown) => string;
};

function run<P>(
  options: CursorFeedOptions<P>,
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

export function useCursorFeed<T, P extends CursorPage<T>>(options: CursorFeedOptions<P>) {
  const [reloads, setReloads] = useState(0);
  const [feed, setFeed] = useState<ListFeed<T, P>>(noFeed);
  const latest = useLatest(options);
  const moreRef = useRef<AbortController | null>(null);
  const key = `${options.key}|${reloads}`;
  const { isEnabled } = options;

  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    const controller = new AbortController();
    moreRef.current?.abort();
    run(
      latest.current,
      LIST_CURSOR_FIRST,
      controller,
      (page) => setFeed(startFeed<T, P>(key, page)),
      (message) => setFeed(failFeed(noFeed<T, P>(), key, message)),
    );

    return () => controller.abort();
  }, [key, isEnabled, latest]);

  useEffect(() => () => moreRef.current?.abort(), []);

  const showMore = useCallback(() => {
    const cursor = feed.nextCursor;

    if (feed.key !== key || cursor === null) {
      return;
    }

    const controller = new AbortController();
    moreRef.current?.abort();
    moreRef.current = controller;
    setFeed((previous) => ({ ...previous, status: LIST_STATUS.LOADING, message: null }));
    run(
      latest.current,
      cursor,
      controller,
      (page) => setFeed((previous) => appendFeed(previous, key, page)),
      (message) => setFeed((previous) => failFeed(previous, key, message)),
    );
  }, [feed.key, feed.nextCursor, key, latest]);

  const retry = useCallback(() => {
    if (feed.key === key && feed.items.length > 0) {
      showMore();
    } else {
      setReloads((count) => count + 1);
    }
  }, [feed.key, feed.items.length, key, showMore]);

  return { ...feedView(feed, key), showMore, retry };
}
