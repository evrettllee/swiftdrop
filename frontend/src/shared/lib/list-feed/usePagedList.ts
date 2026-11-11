import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import { LIST_STATUS, type ListStatus } from '@/shared/config';

export type BoundedPage<T> = { items: T[]; total: number; until: number | null };

type PageAnswer<P> = {
  key: string;
  status: ListStatus;
  page: P | null;
  message: string | null;
};

type PagedListOptions<P> = {
  key: string;
  page: number;
  pageSize: number;
  until: number | null;
  onUntil: (until: number | null) => void;
  isEnabled: boolean;
  load: (page: number, until: number | null, signal: AbortSignal) => Promise<P>;
  messageOf: (error: unknown) => string;
};

export function usePagedList<T, P extends BoundedPage<T>>(options: PagedListOptions<P>) {
  const { page, pageSize, isEnabled } = options;
  const [reloads, setReloads] = useState(0);
  const [answer, setAnswer] = useState<PageAnswer<P> | null>(null);
  const key = `${options.key}|${page}|${reloads}`;
  const readOptions = useEffectEvent(() => options);

  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    const controller = new AbortController();
    const { load, until, onUntil, messageOf } = readOptions();

    load(page, until, controller.signal).then(
      (result) => {
        if (controller.signal.aborted) {
          return;
        }

        setAnswer({ key, status: LIST_STATUS.READY, page: result, message: null });

        if (until === null) {
          onUntil(result.until);
        }
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setAnswer({ key, status: LIST_STATUS.ERROR, page: null, message: messageOf(error) });
        }
      },
    );

    return () => controller.abort();
  }, [key, page, isEnabled]);

  const retry = useCallback(() => setReloads((count) => count + 1), []);
  const current = answer !== null && answer.key === key ? answer : null;
  const total = current?.page?.total ?? 0;

  return {
    status: current?.status ?? LIST_STATUS.LOADING,
    answer: current?.page ?? null,
    items: current?.page?.items ?? [],
    total,
    message: current?.message ?? null,
    totalPages: Math.ceil(total / pageSize),
    retry,
  };
}
