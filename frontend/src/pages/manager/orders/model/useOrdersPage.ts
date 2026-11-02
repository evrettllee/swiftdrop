import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import {
  getManagerOrdersPage,
  type ManagerOrderListItem,
  type ManagerOrdersListQuery,
  type ManagerOrdersPage,
} from '@/shared/staff-api';
import { LIST_STATUS, type ListStatus } from '@/shared/config';
import { fetchOutcome, type FetchOutcome } from './orders-fetch';

type PageAnswer = {
  key: string;
  status: ListStatus;
  items: ManagerOrderListItem[];
  total: number;
  message: string | null;
};

const NO_ANSWER: PageAnswer = {
  key: '',
  status: LIST_STATUS.LOADING,
  items: [],
  total: 0,
  message: null,
};

function toAnswer(
  previous: PageAnswer,
  key: string,
  outcome: FetchOutcome<ManagerOrdersPage>,
): PageAnswer {
  return outcome.data === null
    ? { ...previous, key, status: LIST_STATUS.ERROR, message: outcome.message }
    : {
        key,
        status: LIST_STATUS.READY,
        items: outcome.data.items,
        total: outcome.data.total,
        message: null,
      };
}

type OrdersPageOptions = {
  query: ManagerOrdersListQuery;
  page: number;
  limit: number;
  until: number | null;
  onUntil: (until: number | null) => void;
  isEnabled: boolean;
};

export function useOrdersPage({
  query,
  page,
  limit,
  until,
  onUntil,
  isEnabled,
}: OrdersPageOptions) {
  const [reloads, setReloads] = useState(0);
  const [answer, setAnswer] = useState<PageAnswer>(NO_ANSWER);
  const key = JSON.stringify([query, page, limit, reloads]);
  const readUntil = useEffectEvent(() => until);
  const takeUntil = useEffectEvent(onUntil);

  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    const controller = new AbortController();
    const requested = readUntil();
    const pagination = { mode: 'page', page, limit, until: requested } as const;

    void fetchOutcome(() => getManagerOrdersPage(query, pagination, controller.signal)).then(
      (outcome) => {
        if (controller.signal.aborted) {
          return;
        }

        setAnswer((previous) => toAnswer(previous, key, outcome));

        if (outcome.data !== null && requested === null) {
          takeUntil(outcome.data.until);
        }
      },
    );

    return () => controller.abort();
  }, [key, query, page, limit, isEnabled]);

  const reload = useCallback(() => setReloads((count) => count + 1), []);
  const isAnswered = answer.key === key;

  return {
    status: isAnswered ? answer.status : LIST_STATUS.LOADING,
    items: answer.items,
    total: answer.total,
    message: isAnswered ? answer.message : null,
    totalPages: Math.max(1, Math.ceil(answer.total / limit)),
    reload,
  };
}
