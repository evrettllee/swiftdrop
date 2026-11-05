import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage, type OrderListItem } from '@/shared/api';
import { LIST_STATUS, type ListStatus } from '@/shared/config';
import { getOrdersPage, type OrdersQuery } from '../api/list-orders';
import { ORDERS_PAGE_SIZE } from '../config/list';
import { ORDERS_TEXTS } from '../config/texts';

type PageAnswer = {
  key: string;
  status: ListStatus;
  items: OrderListItem[];
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

type OrdersPageOptions = { query: OrdersQuery; page: number; isEnabled: boolean };

export function useOrdersPage({ query, page, isEnabled }: OrdersPageOptions) {
  const [reloads, setReloads] = useState(0);
  const [answer, setAnswer] = useState<PageAnswer>(NO_ANSWER);
  const key = JSON.stringify([query, page, reloads]);

  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    const controller = new AbortController();

    getOrdersPage(query, page, controller.signal).then(
      ({ items, total }) => {
        if (!controller.signal.aborted) {
          setAnswer({ ...NO_ANSWER, key, status: LIST_STATUS.READY, items, total });
        }
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          const message = getApiErrorMessage(error, ORDERS_TEXTS.LIST_FAILED);
          setAnswer({ ...NO_ANSWER, key, status: LIST_STATUS.ERROR, message });
        }
      },
    );

    return () => controller.abort();
  }, [key, query, page, isEnabled]);

  const retry = useCallback(() => setReloads((count) => count + 1), []);
  const isCurrent = answer.key === key;
  const total = isCurrent ? answer.total : 0;

  return {
    status: isCurrent ? answer.status : LIST_STATUS.LOADING,
    items: isCurrent ? answer.items : [],
    total,
    message: isCurrent ? answer.message : null,
    totalPages: Math.ceil(total / ORDERS_PAGE_SIZE),
    retry,
  };
}
